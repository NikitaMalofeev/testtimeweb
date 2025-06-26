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
import { ErrorBoundary } from 'app/providers/ErrorBoundary/ErrorBoundary';
import { ErrorPage } from 'pages/ErrorPage/ErrorPage';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>

    <BrowserRouter basename="/">
      <StoreProvider>
        <PersistGate loading={<Cover />} persistor={persistor}>

          <ErrorBoundary
            fallbackRender={(error, errorInfo, resetErrorBoundary) => (
              <ErrorPage
                error={error}
                errorInfo={errorInfo}
                resetErrorBoundary={resetErrorBoundary}
              />
            )}
          >
            <App />
          </ErrorBoundary>

        </PersistGate>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode >
);
