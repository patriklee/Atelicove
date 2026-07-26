import { useState } from 'react';

const useConfirmationDialog = () => {
  const [target, setTarget] = useState(null);

  const openDialog = (nextTarget) => setTarget(nextTarget);
  const closeDialog = () => setTarget(null);

  return {
    open: Boolean(target),
    target,
    openDialog,
    closeDialog,
  };
};

export default useConfirmationDialog;
