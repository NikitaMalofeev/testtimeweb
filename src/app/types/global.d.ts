declare module '*.scss' {
    interface IClassNames {
        [className: string]: string
    }
    const classNames: IClassNames;
    export = classNames;
}
declare module '*.svg' {
    import * as React from 'react';

    const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}

declare module 'react-base64-to-pdf'
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
