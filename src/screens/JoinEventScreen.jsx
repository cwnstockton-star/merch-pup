import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { joinEventByCode, normalizeEventCode, savePendingJoinCode } from '../lib/joinEvent';
import './CreateAccountScreen.css';

// Landing page for event join links: /join/<EVENT_CODE>
// - Signed-in fan → connected to the event and sent straight to it
// - Signed out    → code is saved; fan signs up / logs in, then lands on the event
export default function JoinEventScreen() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  // Result of the async join attempt: null (pending) | 'not-found' | 'error'
  const [joinResult, setJoinResult] = useState(null);
  const started = useRef(false);
  const eventCode = normalizeEventCode(code);

  const role = profile?.role ?? session?.user.user_metadata?.role;
  // ('venue' = promoter accounts created before the role was renamed)
  const isPromoter = role === 'promoter' || role === 'venue';

  // 'working' | 'invite' | 'not-found' | 'promoter' | 'error'
  let status = 'working';
  if (!loading) {
    if (!session) status = 'invite';
    else if (isPromoter) status = 'promoter';
    else if (joinResult) status = joinResult;
  }

  useEffect(() => {
    if (loading) return;

    // Signed out: remember the code so it's used right after sign-up / login
    if (!session) {
      savePendingJoinCode(eventCode);
      return;
    }
    if (isPromoter || started.current) return;

    started.current = true;
    joinEventByCode(session.user.id, eventCode)
      .then((eventId) => {
        if (eventId) {
          navigate(`/events/${eventId}`, { replace: true, state: { autoFollowed: true } });
        } else {
          setJoinResult('not-found');
        }
      })
      .catch(() => setJoinResult('error'));
  }, [loading, session, isPromoter, eventCode, navigate]);

  let heading, sub, actions;

  if (status === 'invite') {
    heading = <>You're<br />invited.</>;
    sub = (
      <>
        You've got a link to an event's merch drop (code <strong>{eventCode}</strong>).
        Create a free account to browse the merch and preorder before the line forms.
      </>
    );
    actions = (
      <>
        <button
          className="btn btn-primary btn-tilt btn-lg btn-block create__cta"
          onClick={() => navigate('/create-account')}
        >
          Create Account
        </button>
        <button className="text-link" onClick={() => navigate('/login')}>
          Already have an account?{' '}
          <span className="text-link--bold">Sign in</span>
        </button>
      </>
    );
  } else if (status === 'not-found') {
    heading = <>Hmm, that<br />didn't work.</>;
    sub = (
      <>
        We couldn't find an event with the code <strong>{eventCode}</strong>.
        Check the sign or link and try entering it yourself.
      </>
    );
    actions = (
      <button
        className="btn btn-primary btn-tilt btn-lg btn-block create__cta"
        onClick={() => navigate('/connect-event', { state: { joinCode: eventCode } })}
      >
        Enter a Code
      </button>
    );
  } else if (status === 'promoter') {
    heading = <>Fans only<br />here.</>;
    sub = (
      <>
        This link connects fans to event <strong>{eventCode}</strong>. You're signed in
        as a promoter, so there's nothing to join.
      </>
    );
    actions = (
      <button
        className="btn btn-primary btn-tilt btn-lg btn-block create__cta"
        onClick={() => navigate('/promoter/dashboard')}
      >
        Go to Dashboard
      </button>
    );
  } else if (status === 'error') {
    heading = <>Couldn't<br />connect.</>;
    sub = 'Check your connection and try again.';
    actions = (
      <button
        className="btn btn-primary btn-tilt btn-lg btn-block create__cta"
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    );
  }

  if (status === 'working') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>
          Connecting you to the event…
        </p>
      </div>
    );
  }

  return (
    <div className="create screen">
      <div className="splash__grain" aria-hidden="true" />
      <div className="splash__top-bar" />

      <div className="create__nav">
        <div style={{ width: 32 }} />
        <Logo size="sm" />
        <div style={{ width: 32 }} />
      </div>

      <div className="create__content">
        <div className="create__heading-wrap">
          <div className="create__heading-highlight" aria-hidden="true" />
          <h1 className="create__heading">{heading}</h1>
        </div>
        <p className="create__sub">{sub}</p>
        <div className="create__actions">{actions}</div>
      </div>
    </div>
  );
}
