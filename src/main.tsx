import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'app/styles/index.scss';
import App from 'app/App';
import { StoreProvider } from 'app/providers/store/ui/StoreProvider';

render(
  <BrowserRouter basename="/">
    {/* <ErrorBoundary> */}
    {/* </ErrorBoundary> */}
    <StoreProvider>
      <App />
    </StoreProvider>
  </BrowserRouter>,
  document.getElementById('root')
);
