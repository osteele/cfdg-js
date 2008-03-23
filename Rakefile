require 'openlaszlo_tasks'

task :deploy_app => 'cfdg.swf' do
  sh "rsync -avz cfdg.swf osteele@osteele.com:tree.com/public"
end

task :ssh_deploy do
  sh "ssh osteele@osteele.com svn up tree.com"
end
