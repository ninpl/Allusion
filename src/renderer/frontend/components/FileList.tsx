import { remote } from 'electron';
import fse from 'fs-extra';
import path from 'path';
import React from 'react';

import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';

import { withRootstore, IRootStoreProp } from '../contexts/StoreContext';
import FileStore from '../stores/FileStore';

import Gallery from './Gallery';
import FileSelectionHeader from './FileSelectionHeader';

export interface IFileListProps extends IRootStoreProp {}

const chooseDirectory = async (fileStore: FileStore) => {
  const dirs = remote.dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
  });

  if (!dirs) {
    return;
  }

  dirs.forEach(async (dir) => {
    // Check if directory
    // const stats = await fse.lstat(dirs[0]);
    const imgExtensions = ['gif', 'png', 'jpg', 'jpeg'];

    const filenames = await fse.readdir(dir);
    const imgFileNames = filenames.filter((f) =>
      imgExtensions.some((ext) =>
        f.toLowerCase()
          .endsWith(ext)),
    );

    imgFileNames.forEach(async (filename) => {
      const joinedPath = path.join(dir, filename);
      console.log(joinedPath);
      fileStore.addFile(joinedPath);
    });
  });
};

const FileList = ({ rootStore: { uiStore, fileStore } }: IFileListProps) => {
  const removeSelectedFiles = async () => {
    await fileStore.removeFilesById(uiStore.fileSelection);
    uiStore.fileSelection.clear();
  };

  return (
    <div>
      {uiStore.fileSelection.length > 0 && (
        <FileSelectionHeader
          numSelectedFiles={uiStore.fileSelection.length}
          onCancel={() => uiStore.fileSelection.clear()}
          onRemove={removeSelectedFiles}
        />
      )}

      <Button onClick={() => chooseDirectory(fileStore)} icon="folder-open">
        Add images to your Visual Library
      </Button>

      <br />
      <br />

      <Gallery />
    </div>
  );
};

export default withRootstore(observer(FileList));
