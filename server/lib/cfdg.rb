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
    @startshape ||= rule.name
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

ATTRIBUTE_NAMES = %w{x y rotate flip size sx sy skew hue sat brightness} unless Object.const_defined?(:ATTRIBUTE_NAMES)

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
    name = {'s' => 'size', 'r' => 'rotate', 'h' => 'hue', 'b' => 'brightness'}[name] || name
    arity = 1
    if %w{size skew}.include?(name)
      value *= 2 if value.length == 1
      arity = 2
    end
    raise "wrong arity: #{name} takes #{arity} got #{value.length}" if value.length != arity
    @attributes << [name, value]
  end
  
  def sort_attributes
    @attributes = @attributes.sort_by {|pair| ATTRIBUTE_NAMES.index pair[0]}
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
  
  def parse source, model
    @model = model if model
    @model ||= Model.new
    @tokens = []
    Lexer.new(source).each do |type, token|
      @tokens << [type, token]
    end
    start
    model
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

class Graphics
  def initialize
    @s = []
  end
  
  def content
    @s.join(' ')
  end
  
  def view
    require 'tempfile'
    src = 'drawing.mvg'
    dst = 'drawing.png'
    Tempfile.open(src) do |f|
      src = f.path
      f << 'translate 100 100 '
      f << 'scale 200 200 '
      f << content
    end
    puts `convert -size 200x200 mvg:#{src} #{dst}`
    `open #{dst}`
  end
  
  def polygon points, transform
    points = transform.transformPoints points
    @s << "polygon #{points.map{|p|p.join(',')}.join(' ')}"
  end
  
  def circle center, radius, transform
    affine = transform.matrix[0].zip(transform.matrix[1]).flatten
    @s << 'push graphic-context' <<
      "affine #{affine.join(',')}" <<
      "circle #{center.join(',')} #{radius},#{radius}" <<
      "pop graphic-context"
  end
  
  def hsv= hsv
    def hsv2rgb h, s, v
      h, s, v = h.to_f, s.to_f, v.to_f
      return v, v, v if s == 0 # gray
      h = h / 60.0 # sector 0 to 5
      i = h.to_i
      f = h - i
      p = v * (1 - s)
      q = v * (1 - s * f)
      t = v * (1 - s * (1 - f))
      [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i % 6]
    end
    rgb = hsv2rgb *hsv
    return if @rgb == rgb
    @rgb = rgb
    @s << "fill ##{@rgb.map{|v|format "%02x",(v*255).to_i}.join('')}"
  end
end

class Transform
  attr_accessor :matrix
  
  class Premultiplier
    def initialize transform
      @target = transform
    end
    
    def method_missing message, *args
      pre = Transform.new
      pre = pre.send(message, *args) || pre
      result = pre * @target
      if message.to_s[-1] == ?!
        @target.matrix = result.matrix
        nil
      else
        result
      end
    end
  end
  
  def pre
    @pre ||= Premultiplier.new self
  end
  
  def initialize matrix=nil, &block
    @matrix = matrix || [[1,0,0],[0,1,0],[0,0,1]]
    yield @matrix if block
  end
  
  def cloned
    clone = Transform.new
    clone.matrix = @matrix.map {|c| c.clone}
    clone
  end
  
  def determinant
    m = @matrix
    m[0][0]*m[1][1] - m[0][1]*m[1][0]
  end
  
  def * b
    ma = self.matrix
    mb = b.matrix
    Transform.new do |m|
      for i in 0..2 do
        for j in 0..2 do
          m[i][j] = (0..2).map{|k| ma[i][k]*mb[k][j]}.sum
        end
      end
    end
  end
  
  def transformPoints points
    mx = @matrix[0]
    my = @matrix[1]
    points.map do |x, y|
      [
        x*mx[0]+y*mx[1]+mx[2],
        x*my[0]+y*my[1]+my[2]]
    end
  end
  
  def scale sx, sy
    xform = Transform.new do |m|
      m[0][0] = sx
      m[1][1] = sy
    end
    self * xform
  end
  
  def translate dx, dy
    xform = Transform.new do |m|
      m[0][2] = dx
      m[1][2] = dy
    end
    self * xform
  end
  
  def rotate r
    xform = Transform.new do |m|
      cos = Math::cos r
      m[0][0] = m[1][1] = cos
      m[0][1] = -(m[1][0] = Math::sin r)
    end
    self * xform
  end
  
  def method_missing message, *args
    if message.to_s[-1] == ?!
      @matrix = send(message.to_s[0...-1], *args).matrix
      return
    end
    super
  end  
end

module Math
  def self.abs x
    x < 0 ? -x : x
  end
end

class Context
  attr_accessor :transform, :color
  
  def initialize graphics, model
    @graphics = graphics || Graphics.new
    @model = model
    @state = {:countdown => 100}
    @transform = Transform.new
    @color = [0,0,0]
  end
  
  def cloned
    clone = self.clone
    clone.transform = @transform.cloned
    clone.color = @color.clone
    clone
  end
  
  def invoke name
    return if Math::abs(@transform.determinant) < 0.1
    return if (@state[:countdown] -= 1) < 0
    @model.invoke name, self
  end
  
  def draw_polygon name, points
    @graphics.hsv = color
    @graphics.polygon points, transform
  end
  
  def draw_circle center, radius
    @graphics.hsv = color
    @graphics.circle center, radius, transform
  end
  
  def rotate r; @transform.pre.rotate! r*Math::PI/180; end
  def size x, y; @transform.pre.scale! x, y; end
  def x dx; @transform.pre.translate! dx, 0; end
  def y dy; @transform.pre.translate! 0, dy; end
  def hue h; @color[0] += h; end
  def sat s; @color[1] = s; end
  def brightness b; @color[2] = b; end
end

module Enumerable
  def sum
    inject(0){|a,b|a+b}
  end
end

class Model
  def draw context
    invoke startshape, context
  end
  
  def invoke name, context
    rule = choose name
    rule.draw context
  end
  
  def choose name
    rules = @rules[name]
    raise "No rule named #{name}" unless rules
    sum = rules.map{|r|r.weight}.sum
    n = sum*rand
    rules.each do |r|
      return r if (n -= r.weight) <= 0
    end
    raise "implementation error"
  end
end

class Rule
  def draw context
    raise "context is #{context.inspect}" unless Context === context
    shapes.each do |shape|
      shape.draw context
    end
  end
end

class Shape
  def draw context
    context = context.cloned
    attributes.each do |name, value|
      context.send name, *value
    end
    message = name.downcase.intern
    return send(message, context) if respond_to?(message)
    context.invoke name
  end
  
  def square context
    context.draw_polygon 'square', [[-0.5,-0.5],[-0.5,0.5],[0.5,0.5],[0.5,-0.5]]
  end

  def circle context
    context.draw_circle [[0,0]], 0.5
  end
  
  def triangle context
    dy = -0.25
    context.draw 'triangle', [[-0.5, dy], [0.5, dy], [0, dy+1]]
  end
end

#puts Parser.new.parse("startshape r rule r {r {r 1 x 1 h 1 y 1}}")

def draw string, view=true
  g = Graphics.new
  m = Model.new
  Parser.new.parse(string, m).draw Context.new(g, m)
  puts g.content unless view
  g.view if view
end

draw "rule R {SQUARE {r 45 sat 1 b 1} R {s .8 h 10 r 10 x 0.1} }", true
