import { Directory, File, Paths } from 'expo-file-system';

type InfoOptions = {
  size?: boolean;
};

type DirOptions = {
  intermediates?: boolean;
};

type DeleteOptions = {
  idempotent?: boolean;
};

type CopyMoveOptions = {
  from: string;
  to: string;
};

type InfoResult = {
  exists: boolean;
  isDirectory: boolean;
  size?: number;
  modificationTime?: number;
  uri?: string;
};

const withSlash = (path: string): string => (path.endsWith('/') ? path : `${path}/`);

const pathInfo = (path: string): { exists: boolean; isDirectory: boolean | null } => Paths.info(path);

const buildFileInfo = (path: string, options?: InfoOptions): InfoResult => {
  const file = new File(path);
  const info = file.info();
  return {
    exists: info.exists,
    isDirectory: false,
    size: options?.size ? info.size ?? 0 : undefined,
    modificationTime: info.modificationTime ?? undefined,
    uri: info.uri,
  };
};

const buildDirectoryInfo = (path: string, options?: InfoOptions): InfoResult => {
  const directory = new Directory(path);
  const info = directory.info();
  return {
    exists: info.exists,
    isDirectory: true,
    size: options?.size ? info.size ?? 0 : undefined,
    modificationTime: info.modificationTime ?? undefined,
    uri: info.uri,
  };
};

const removePath = (path: string, options?: DeleteOptions): void => {
  const info = pathInfo(path);
  if (!info.exists) {
    if (options?.idempotent) {
      return;
    }
    throw new Error(`Path does not exist: ${path}`);
  }

  if (info.isDirectory) {
    new Directory(path).delete();
    return;
  }

  new File(path).delete();
};

const copyPath = ({ from, to }: CopyMoveOptions): void => {
  const info = pathInfo(from);
  if (!info.exists) {
    throw new Error(`Source path does not exist: ${from}`);
  }

  if (info.isDirectory) {
    new Directory(from).copy(new Directory(to));
    return;
  }

  new File(from).copy(new File(to));
};

const movePath = ({ from, to }: CopyMoveOptions): void => {
  const info = pathInfo(from);
  if (!info.exists) {
    throw new Error(`Source path does not exist: ${from}`);
  }

  if (info.isDirectory) {
    new Directory(from).move(new Directory(to));
    return;
  }

  new File(from).move(new File(to));
};

export const fs = {
  documentDirectory: withSlash(Paths.document.uri),
  cacheDirectory: withSlash(Paths.cache.uri),

  async getInfoAsync(path: string, options?: InfoOptions): Promise<InfoResult> {
    const info = pathInfo(path);
    if (!info.exists) {
      return {
        exists: false,
        isDirectory: false,
        uri: path,
      };
    }

    if (info.isDirectory) {
      return buildDirectoryInfo(path, options);
    }

    return buildFileInfo(path, options);
  },

  async makeDirectoryAsync(path: string, options?: DirOptions): Promise<void> {
    const directory = new Directory(path);
    directory.create({
      intermediates: options?.intermediates ?? false,
      idempotent: true,
    });
  },

  async readDirectoryAsync(path: string): Promise<string[]> {
    const directory = new Directory(path);
    const entries = directory.list();
    return entries.map(entry => entry.name);
  },

  async deleteAsync(path: string, options?: DeleteOptions): Promise<void> {
    removePath(path, options);
  },

  async copyAsync(options: CopyMoveOptions): Promise<void> {
    copyPath(options);
  },

  async moveAsync(options: CopyMoveOptions): Promise<void> {
    movePath(options);
  },
};
