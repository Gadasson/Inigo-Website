import Link from 'next/link';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks';
import OpenInInigoButton from '@/components/guided-session/OpenInInigoButton';
import GuidedSessionShareCover from '@/components/guided-session/GuidedSessionShareCover';
import {
  PUBLIC_SHARE_INSTALL_NOTE,
  publicContentShareCopy,
  type PublicContentKind,
  type PublicContentPreviewResult,
} from '@/lib/publicContentShare';

type Props = {
  kind: PublicContentKind;
  preview: PublicContentPreviewResult;
  openUrl: string;
  coverSrc?: string;
};

export default function PublicContentSharePage({ kind, preview, openUrl, coverSrc }: Props) {
  const copy = publicContentShareCopy(kind, preview);
  const showCover = preview.kind === 'ok' && Boolean(coverSrc);

  const contentLanguage = preview.kind === 'ok' ? preview.displayLanguage : undefined;

  return (
    <main className="gss" lang={contentLanguage} dir={contentLanguage === 'he' ? 'rtl' : undefined}>
      <div className="gss__card">
        {preview.kind === 'ok' && (
          <div className="gss__media" aria-hidden={!showCover}>
            {showCover && coverSrc ? (
              <GuidedSessionShareCover src={coverSrc} />
            ) : (
              <div className="gss__empty-media" aria-hidden>
                <span>🌿</span>
              </div>
            )}
          </div>
        )}

        <div className="gss__body">
          <h1 className="gss__title">{copy.title}</h1>
          {copy.description ? <p className="gss__desc">{copy.description}</p> : null}

          <div className="gss__actions">
            <OpenInInigoButton className="gss__btn gss__btn--primary" httpsUrl={openUrl} />
            <div className="gss__stores">
              <a className="gss__store" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                App Store
              </a>
              <a className="gss__store" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                Google Play
              </a>
            </div>
            <p className="gss__lede" style={{ marginTop: '0.75rem', marginBottom: 0, maxWidth: 'none' }}>
              {PUBLIC_SHARE_INSTALL_NOTE}
            </p>
          </div>
        </div>
      </div>

      <div className="gss__brand">
        <Link href="/en">inigo.now</Link>
      </div>
    </main>
  );
}
