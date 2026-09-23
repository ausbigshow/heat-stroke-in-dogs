// Session-scoped resume point. sessionStorage can throw (private mode, blocked storage) —
// every access is wrapped; failure means "no saved progress", never an exception.
export const progressStore = {
  save(screenKey, state) {
    try {
      const data = {
        v: 1,
        screen: screenKey,
        state: state,
        savedAt: Date.now()
      };
      sessionStorage.setItem('callie-tay.progress.v1', JSON.stringify(data));
    } catch (e) {
      // Ignore exception
    }
  },
  
  load() {
    try {
      const dataStr = sessionStorage.getItem('callie-tay.progress.v1');
      if (!dataStr) return null;
      const data = JSON.parse(dataStr);
      if (data.v !== 1 || !data.screen) return null;
      return { screen: data.screen, state: data.state };
    } catch (e) {
      return null;
    }
  },
  
  clear() {
    try {
      sessionStorage.removeItem('callie-tay.progress.v1');
    } catch (e) {
      // Ignore exception
    }
  }
};
