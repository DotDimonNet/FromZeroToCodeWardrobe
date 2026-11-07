import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()], server:{proxy:{'/api':'http://localhost:5080','/signin-google':'http://localhost:5080','/signin-facebook':'http://localhost:5080'}}});
