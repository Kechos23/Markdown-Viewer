import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {passwordHash} from './security.mjs';
const boolean=(env,name,fallback)=>{if(env[name]===undefined)return fallback;if(!['true','false'].includes(env[name]))throw new Error(name+' must be true or false.');return env[name]==='true';};
const origins=value=>(value || '').split(',').filter(Boolean).map(value=>{const url=new URL(value.trim());if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || !['','/'].includes(url.pathname))throw new Error('Server policies require HTTPS origins.');return url.origin;});
export async function environmentConfiguration(env){
  const enabled=boolean(env,'CLOUD_ENABLED',false),remember=boolean(env,'CLOUD_REMEMBER_CONNECTIONS',false),development=boolean(env,'CLOUD_DEVELOPMENT',false);
  const dataDirectory=env.CLOUD_DATA_DIR || '/data';
  const config={enabled,remember,development,origin:env.CLOUD_PUBLIC_URL || null,dynamicOrigin:!env.CLOUD_PUBLIC_URL,publicApp:true,targets:[],allowAnyPublicTarget:true,allowedServers:origins(env.CLOUD_ALLOWED_SERVERS),privateServers:origins(env.CLOUD_PRIVATE_SERVERS)};
  if(!enabled)return {config,dataDirectory};
  if(env.CLOUD_ACCESS_PASSWORD && env.CLOUD_ACCESS_PASSWORD_FILE)throw new Error('Use only one cloud password source.');
  const password=env.CLOUD_ACCESS_PASSWORD_FILE?(await readFile(env.CLOUD_ACCESS_PASSWORD_FILE,'utf8')).replace(/\r?\n$/,''):env.CLOUD_ACCESS_PASSWORD;
  if(typeof password!=='string' || password.length<12 || Buffer.byteLength(password)>4096)throw new Error('Configure a cloud access password of at least 12 characters.');
  const salt=randomBytes(16).toString('hex');config.owner={username:'owner',salt,passwordHash:passwordHash(password,salt)};
  let key;
  if(remember){
    await mkdir(dataDirectory,{recursive:true,mode:0o700});
    if(env.CLOUD_CREDENTIAL_KEY_FILE)key=await readFile(env.CLOUD_CREDENTIAL_KEY_FILE);
    else {
      const keyFile=path.join(dataDirectory,'credential.key');
      try{key=await readFile(keyFile);}catch(error){if(error.code!=='ENOENT')throw error;key=randomBytes(32);try{await writeFile(keyFile,key,{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;key=await readFile(keyFile);}}
    }
    if(key.length!==32)throw new Error('The credential key must contain 32 bytes.');
  }
  return {config,key,dataDirectory};
}
