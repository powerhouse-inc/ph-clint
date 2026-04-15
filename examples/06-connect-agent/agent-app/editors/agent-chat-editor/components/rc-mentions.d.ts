// Type shim for @rc-component/mentions under nodenext + verbatimModuleSyntax.
// The package ships CJS without "type": "module", so TypeScript treats default
// imports as the module namespace rather than the component.
declare module "@rc-component/mentions" {
  import type {
    ForwardRefExoticComponent,
    RefAttributes,
    ReactNode,
    CSSProperties,
  } from "react";

  export interface DataDrivenOptionProps {
    value?: string;
    key?: string;
    disabled?: boolean;
    label?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }

  export interface MentionsProps {
    id?: string;
    autoFocus?: boolean;
    className?: string;
    defaultValue?: string;
    notFoundContent?: ReactNode;
    split?: string;
    style?: CSSProperties;
    placement?: "top" | "bottom";
    direction?: "ltr" | "rtl";
    prefix?: string | string[];
    prefixCls?: string;
    value?: string;
    silent?: boolean;
    filterOption?:
      | false
      | ((input: string, option: DataDrivenOptionProps) => boolean);
    onChange?: (text: string) => void;
    onSelect?: (option: DataDrivenOptionProps, prefix: string) => void;
    onSearch?: (text: string, prefix: string) => void;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
    onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    getPopupContainer?: () => HTMLElement;
    popupClassName?: string;
    children?: ReactNode;
    options?: DataDrivenOptionProps[];
    rows?: number;
    autoSize?: boolean | { minRows?: number; maxRows?: number };
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    allowClear?: boolean;
    classNames?: {
      mentions?: string;
      textarea?: string;
      popup?: string;
    };
    styles?: {
      suffix?: CSSProperties;
      textarea?: CSSProperties;
      popup?: CSSProperties;
    };
    transitionName?: string;
    onPopupScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
    onClear?: () => void;
    onResize?: (size: { width: number; height: number }) => void;
  }

  export interface MentionsRef {
    focus: () => void;
    blur: () => void;
    textarea: HTMLTextAreaElement | null;
    nativeElement: HTMLElement;
  }

  const Mentions: ForwardRefExoticComponent<
    MentionsProps & RefAttributes<MentionsRef>
  >;
  export default Mentions;
}
