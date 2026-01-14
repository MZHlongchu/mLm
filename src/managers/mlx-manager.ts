import { LLM, ModelManager } from 'react-native-nitro-mlx';
import { EngineCaps, GenOpts, InferenceManager, Msg } from './inference-manager';
import * as FileSystem from 'expo-file-system';

const caps: EngineCaps = {
  embeddings: false,
  vision: false,
  audio: false,
  rag: false,
  grammar: false,
  jinja: false,
  dry: false,
  mirostat: false,
  xtc: false,
};

type State = {
  loaded: boolean,
  modelId: string,
};

class MlxManager implements InferenceManager {
  private state: State = { loaded: false, modelId: '' };

  private async migrateFilesIfNeeded(modelId: string): Promise<boolean> {
    try {
      const modelPrefix = modelId.replace(/\//g, '_');
      const modelsDir = `${FileSystem.documentDirectory}models/`;
      const targetDir = `${FileSystem.documentDirectory}huggingface/models/${modelPrefix}/`;
      
      const dirInfo = await FileSystem.getInfoAsync(modelsDir);
      if (!dirInfo.exists) return false;
      
      const files = await FileSystem.readDirectoryAsync(modelsDir);
      const modelFiles = files.filter(f => f.startsWith(modelPrefix + '_'));
      
      if (modelFiles.length === 0) return false;
      
      console.log('mlx_migrating_files', { modelId, fileCount: modelFiles.length });
      
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      
      for (const filename of modelFiles) {
        const sourceFile = `${modelsDir}${filename}`;
        const targetFilename = filename.replace(modelPrefix + '_', '');
        const targetFile = `${targetDir}${targetFilename}`;
        
        await FileSystem.moveAsync({
          from: sourceFile,
          to: targetFile
        });
        
        console.log('mlx_file_migrated', { from: filename, to: targetFilename });
      }
      
      console.log('mlx_migration_complete', modelId);
      return true;
    } catch (error) {
      console.log('mlx_migration_error', error);
      return false;
    }
  }

  async init(modelIdOrPath: string) {
    console.log('mlx_init_start', modelIdOrPath);
    
    let modelId = modelIdOrPath;
    
    if (modelIdOrPath.includes('/models/') || 
        modelIdOrPath.includes('/mlx/') || 
        modelIdOrPath.includes('file://') ||
        modelIdOrPath.startsWith('lmstudio-community_') ||
        modelIdOrPath.includes('_')) {
      if (modelIdOrPath.includes('file://') || modelIdOrPath.includes('/')) {
        const parts = modelIdOrPath.split('/');
        const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
        modelId = lastPart;
      }
      
      modelId = modelId.replace(/_/g, '/');
      console.log('mlx_extracted_model_id', { path: modelIdOrPath, modelId });
    }

    try {
      let isDownloaded = await ModelManager.isDownloaded(modelId);
      
      if (!isDownloaded) {
        console.log('mlx_attempting_migration', modelId);
        const migrated = await this.migrateFilesIfNeeded(modelId);
        if (migrated) {
          isDownloaded = await ModelManager.isDownloaded(modelId);
        }
      }
      
      if (!isDownloaded) {
        throw new Error('mlx_model_not_downloaded');
      }

      await LLM.load(modelId, {
        onProgress: (progress) => {
          console.log('mlx_loading_progress', progress);
        },
        manageHistory: true,
      });
      
      this.state = { loaded: true, modelId };
      console.log('mlx_init_complete', modelId);
    } catch (error) {
      console.log('mlx_init_error', error);
      throw error;
    }
  }

  async gen(messages: Msg[], opts?: GenOpts) {
    if (!this.state.loaded) {
      throw new Error('engine_not_ready');
    }
    
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : '';
    
    let full = '';
    await LLM.stream(prompt, token => {
      full += token;
      if (opts?.onToken) {
        opts.onToken(token);
      }
    });
    
    return full.trim();
  }

  async embed(text: string) {
    return Promise.reject<number[]>(new Error('embeddings_not_supported'));
  }

  async release() {
    if (this.state.loaded) {
      try {
        console.log('mlx_unload_start');
        LLM.unload();
        this.state = { loaded: false, modelId: '' };
        console.log('mlx_unload_complete');
      } catch (error) {
        console.log('mlx_unload_error', error);
        this.state = { loaded: false, modelId: '' };
      }
    }
  }

  caps() {
    return caps;
  }

  ready() {
    return this.state.loaded;
  }
}

export const mlxManager = new MlxManager();
