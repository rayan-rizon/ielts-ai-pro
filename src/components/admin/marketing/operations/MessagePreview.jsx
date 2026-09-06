import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TILE, TITLE, MICRO, MUTED } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { date, pretty, report } from './operationsConstants';

const CSP_META =
  "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'\">";

function sanitizeEmailHtml(rawHtml) {
  if (!rawHtml) return '';
  const clean = DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'form', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'img'],
    FORBID_ATTR: ['srcset', 'src', 'href', 'background'],
  });
  return `${CSP_META}${clean}`;
}

function checkIsEmail(item) {
  return item.kind === 'emails' || item.channel === 'email';
}

function getChannelLabel(item, isEmail) {
  if (item.channel) return item.channel;
  if (isEmail) return 'email';
  return item.recommended_channel;
}

function EmailUnavailableView({ email, content }) {
  return (
    <>
      <p>{email.reason}</p>
      {content && (
        <div className={cn(TILE, 'p-3')}>
          <p className={MICRO}>Saved copy · original email unavailable</p>
          <h3 className={TITLE}>{content.title}</h3>
          <p className="mt-2 text-sm">{content.message}</p>
        </div>
      )}
    </>
  );
}

function EmailAvailableView({ email, html }) {
  return (
    <>
      <h3 className={TITLE}>{email.subject}</h3>
      <p className="text-xs">
        Provider status: {pretty(email.provider_status)}. External images and links are disabled in
        this preview.
      </p>
      {html ? (
        <iframe
          title="Original email preview"
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={html}
          className="h-96 w-full border-0"
        />
      ) : (
        <pre className="whitespace-pre-wrap text-sm">
          {email.text || 'The provider has no retained body.'}
        </pre>
      )}
    </>
  );
}

function EmailPreviewBody({ email, error, item }) {
  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!email) {
    return <p role="status">Retrieving original email…</p>;
  }
  if (email.available === false) {
    return <EmailUnavailableView email={email} content={item.content} />;
  }
  const html = sanitizeEmailHtml(email.html);
  return <EmailAvailableView email={email} html={html} />;
}

function NonEmailPreviewBody({ content }) {
  return (
    <div className={cn(TILE, 'p-4')}>
      <h3 className={TITLE}>{content?.title || 'No saved title'}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm">
        {content?.message || 'Message content was not retained.'}
      </p>
      {content?.cta_label && <p className="mt-3 text-sm font-bold">{content.cta_label}</p>}
      {content?.cta_url && <p className="mt-1 break-all text-xs">Destination: {content.cta_url}</p>}
      <p className={cn(MUTED, 'mt-3 text-xs')}>
        Saved content; appearance may vary by device. Push lock-screen text may be generic.
      </p>
    </div>
  );
}

export function MessagePreview({ item, user, onClose }) {
  const [email, setEmail] = useState(null);
  const [error, setError] = useState('');
  const isEmail = checkIsEmail(item);

  useEffect(() => {
    let active = true;
    if (!isEmail) return undefined;

    report('admin_email_preview', {
      user_id: user.id,
      message_id: item.id,
      kind: item.kind,
    })
      .then((value) => {
        if (active) setEmail(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [isEmail, item.id, item.kind, user.id]);

  const channelLabel = getChannelLabel(item, isEmail);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recorded message</DialogTitle>
          <DialogDescription>
            {pretty(channelLabel)} · {date(item.at)}. Preview only; no message will be sent.
          </DialogDescription>
        </DialogHeader>

        {isEmail ? (
          <EmailPreviewBody email={email} error={error} item={item} />
        ) : (
          <NonEmailPreviewBody content={item.content} />
        )}
      </DialogContent>
    </Dialog>
  );
}
