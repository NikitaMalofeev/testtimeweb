import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import 'app/styles/index.scss';
import 'app/styles/variables/global.scss';
import 'app/styles/reset.scss';
import App from 'app/App';
import { StoreProvider } from 'app/providers/store/ui/StoreProvider';
import React from 'react';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      {/* <ErrorBoundary> */}
      {/* </ErrorBoundary> */}
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);