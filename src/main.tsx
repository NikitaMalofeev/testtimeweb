import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'app/styles/index.scss';
import 'app/styles/variables/global.scss';
import 'app/styles/reset.scss';
import App from 'app/App';
import { StoreProvider } from 'app/providers/store/ui/StoreProvider';
import { PersistGate } from 'redux-persist/integration/react';
import React from 'react';
import { persistor } from 'app/providers/store/config/store';
import { Cover } from 'shared/ui/Cover/Cover';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <PersistGate loading={<Cover />} persistor={persistor}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </PersistGate>
    </BrowserRouter>
  </React.StrictMode>
);
