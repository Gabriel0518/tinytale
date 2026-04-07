import NextErrorComponent, { type ErrorProps } from 'next/error';

export default function TinyTaleErrorPage(props: ErrorProps) {
  return <NextErrorComponent {...props} />;
}
