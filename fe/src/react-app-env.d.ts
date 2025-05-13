/// <reference types="react-scripts" />

import * as React from 'react';

declare global {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface ElementClass extends React.Component<any> {
            render(): React.ReactNode;
        }
        interface ElementAttributesProperty { props: {}; }
        interface ElementChildrenAttribute { children: {}; }
        interface IntrinsicAttributes extends React.Attributes { }
        interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
        interface IntrinsicElements {
            // HTML elements
            div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
            p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
            a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
            button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
            input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
            label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
            img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
            video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
            audio: React.DetailedHTMLProps<React.AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>;
            form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
            select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
            textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
            table: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
            tr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
            td: React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
            th: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
            ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
            ol: React.DetailedHTMLProps<React.OListHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
            li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
            h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
            h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
            h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
            h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
            h5: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
            h6: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
        }
    }
}

// Extend ReactNode type to include Element
declare module 'react' {
    interface ReactNode {
        type?: string | React.ComponentType<any>;
        props?: any;
        key?: string | number | null;
    }

    // Add missing React exports
    export const useState: typeof import('react').useState;
    export const useEffect: typeof import('react').useEffect;
    export const StrictMode: React.ComponentType<{ children?: React.ReactNode }>;
    export type FC<P = {}> = React.FunctionComponent<P>;
    export type ChangeEvent<T = Element> = React.ChangeEvent<T>;

    // Add missing React types
    export type ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> = {
        type: T;
        props: P;
        key: Key | null;
    };

    export type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);

    export type Key = string | number;

    export type Component<P = {}, S = {}, SS = any> = ComponentLifecycle<P, S, SS>;

    export interface ComponentLifecycle<P, S, SS = any> {
        render(): ReactNode;
    }

    export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNodeArray;
    export interface ReactNodeArray extends Array<ReactNode> {}

    // Add FunctionComponent type
    export interface FunctionComponent<P = {}> {
        (props: P, context?: any): ReactElement | null;
        displayName?: string;
        defaultProps?: Partial<P>;
        propTypes?: WeakValidationMap<P>;
    }

    // Add WeakValidationMap type
    export type WeakValidationMap<T> = {
        [K in keyof T]?: null extends T[K]
            ? Validator<T[K] | null | undefined>
            : undefined extends T[K]
            ? Validator<T[K] | null | undefined>
            : Validator<T[K]>;
    };

    // Add Validator type
    export type Validator<T> = (props: { [key: string]: any }, propName: string, componentName: string, location: string, propFullName: string) => Error | null;

    // Add Element type
    export type Element = ReactElement;
} 