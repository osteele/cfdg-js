require 'ows_tasks'
require 'openlaszlo_tasks'

desc "Upload the app to the server"
task :app_deploy => 'cfdg.swf' do
  rsync 'cfdg.swf', 'osteele@osteele.com:tree.com/public'
end

desc "Sync the server to svn"
task :svn_deploy do
  sh "ssh osteele@osteele.com svn up tree.com"
end

task 'canvas.html' => "cfdg.html" do
  sh "sed 's:src=\":src=\"javascripts\/:' cfdg.html > canvas.html"
end

task :deploy_html do
  rsync 'canvas.html', 'osteele@osteele.com:tree.com/public'
  rsync ['cfdg.js', 'parser.js', 'model.js', 'graphics.js', 'drawing.js'], 'osteele@osteele.com:tree.com/public/javascripts'
end

desc "Deploy the app and pages to the server"
multitask :deploy => [:app_deploy, :svn_deploy]
