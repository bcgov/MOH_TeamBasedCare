import '@testing-library/jest-dom';

// jsdom lacks ResizeObserver, which floating-ui's autoUpdate observes elements with
global.ResizeObserver =
  global.ResizeObserver ||
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
