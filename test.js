import { exec } from 'child_process';

exec('echo hello', { shell: 'cmd.exe' }, (err, stdout, stderr) => {
  console.log('err:', err);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
});