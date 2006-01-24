require 'openlaszlo_tasks'

desc "Upload the app to the server"
task :app_deploy => 'cfdg.swf' do
  sh "rsync -avz cfdg.swf osteele@osteele.com:tree.com/public"
end

desc "Sync the server to svn"
task :svn_deploy do
  sh "ssh osteele@osteele.com svn up tree.com"
end

desc "Deploy the app and pages to the server"
multitask :deploy => [:app_deploy, :svn_deploy]
