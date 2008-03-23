require 'openlaszlo_tasks'

desc "Upload the app to the server"
task :deploy_app => 'cfdg.swf' do
  sh "rsync -avz cfdg.swf osteele@osteele.com:tree.com/public"
end

desc "Sync the server to svn"
task :svn_deploy do
  sh "ssh osteele@osteele.com svn up tree.com"
end
