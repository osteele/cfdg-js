class Model
  attr_accessor :startshape, :rules
  
  def initialize
    @rules = {}
  end
  
  def to_s
    s = ''
    s = "startshape #{@startshape}\n" if @startshape
    s += @rules.values.map{|r|r.to_s}.join("\n")
  end
  
  def add_rule rule
    @rules[rule.name] ||= []
    @rules[rule.name] << rule
    @start_rule ||= rule.name
  end
end

class Rule
  attr_accessor :name, :weight, :shapes
  
  def initialize name
    @name = name
    @weight = 1.0
    @shapes = []
  end
  
  def to_s
    s = "rule #{name}#{' '+weight if weight != 1.0} {"
    s += "\n" if shapes
    s += shapes.map{|s|'  '+s.to_s + "\n"}.join
    return s + "}"
  end
end

class Shape
  attr_accessor :name, :attributes
  
  def initialize name
    @name = name
    @attributes = []
  end
  
  def to_s
    "#{name} [#{@attributes.map{|n,v|n+' '+v.join(' ')}.join(' ')}]"
  end
  
  def set_attribute name, value
    name = {'s' => 'size', 'h' => 'hue', 'b' => 'brightness'}[name] || name
    arity = 1
    if %w{size skew}.include?(name)
      value *= 2 if value.length == 1
      arity = 2
    end
    raise "wrong arity: #{name} takes #{arity} got #{value.length}" if value.length != arity
    @attributes << [name, value]
  end
  
  def sort_attributes
  end
end

class CompilationError < StandardError; end

class Lexer
  def initialize source
    @source = source
  end
  
  def each
    @source.split(/\n|\r/).each_with_index do |line, i|
      @lineno = i+1
      callcc do |next_line|
        line.split(/\s+/).each do |word|
          begin
            while word.any?
              next_line if word =~ /--/
              case word
              when /^\d+(\.\d*)?|\.\d+/
                word = $'
                yield Float, $&.to_f
              when /^[\[\]\{\}\|]/
                word = $'
                yield '<<punctuation>>', $&
              when /^\w+/
                word = $'
                yield String, $&
              else
                raise "Uknown word: #{word.inspect}"
              end
            end
          rescue CompilationError
            raise "#{$!.message} at #{word} on line #{@lineno}"
          end
        end
      end
    end
    yield '<<eof>>', nil
  end
end

class Parser
  attr_accessor :model
  
  def parse source
    @model ||= Model.new
    @tokens = []
    Lexer.new(source).each do |type, token|
      @tokens << [type, token]
    end
    start
    self
  end
  
  def compilation_error message
    raise "#{message}; #{@tokens.inspect}"
  end
  
  def peek_type; @tokens.first[0]; end
  def peek_token; @tokens.first[1]; end
  def next_token; @tokens.shift[1]; end
  
  def expect_type type
    compilation_error "expected #{type}" unless peek_type == type
    next_token
  end

  def expect_string
    compilation_error "expected a string" unless peek_type == String
    next_token
  end
  
  # Returns the token
  def expect_token *list
    compilation_error "expected #{list.inspect}, got #{peek_token}" unless list.include? peek_token
    next_token
  end
  
  def start
    if peek_token == 'startshape'
      next_token
      model.startshape = expect_string
    end
    rule while peek_token == 'rule'
    expect_type '<<eof>>'
  end
  
  def rule
    expect_token 'rule'
    rule = Rule.new expect_string
    model.add_rule rule
    if peek_type == Float
      rule.weight = next_token
    end
    expect_token '{'
    while peek_token != '}'
      rule.shapes << shape
    end
    expect_token '}'
  end
  
  def shape
    shape = Shape.new expect_string
    case expect_token('{', '[')
    when '{'
      final = '}'
      sort = true
    when ']'
      final = ']'
      sort = false
    end
    while peek_token != final
      name = expect_string
      value = []
      while peek_type == Float
        value << next_token
      end
      shape.set_attribute name, value
    end
    expect_token final
    shape.sort_attributes if sort
    shape
  end
end

puts Parser.new.parse("startshape r rule r {r {}}").model
