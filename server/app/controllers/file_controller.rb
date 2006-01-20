class FileController < ApplicationController
  model :document
  
  def list
    files = Document.find :all
    xm = Builder::XmlMarkup.new
    s = xm.files {
      for file in files do
        xm.file(:id => file.id, :name => file.name)
      end
    }
    response.headers["Content-Type"] = "text/xml"
    render :text => s
  end
  
  def save
    file = params['id'] && Document.find(params['id'])
    #file = Document.find_by_name(params['name'])
    file ||= Document.new
    file.name = params['name']
    file.content = params['content']
    file.save
    response.headers["Content-Type"] = "text/xml"
    render :text => "<saved id='#{file.id}'/>"
  end
  
  def show
    file = Document.find params['id']
    xm = Builder::XmlMarkup.new
    s = xm.content {
      xm.text! file.content
    }
    response.headers["Content-Type"] = "text/xml"
    render :text => s
  end
end
