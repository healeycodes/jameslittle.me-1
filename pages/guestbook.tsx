import classNames from "classnames";
import { useState, useRef, useCallback, useEffect } from "react";
import { PageLayout } from "../layouts/PageLayout";
import { FullWidth, Grid, Left, Right, Subgrid } from "../src/components/grid";
import { relative, toIso } from "../src/utils/relative-date";

type GuestbookEntry = {
  id: string;
  created_at: string;
  url: string;
  message: string;
  name: string;
};

export async function getStaticProps(_context: any) {
  const entries: GuestbookEntry[] = await fetch(
    "https://api.jameslittle.me/guestbook"
  )
    .then((r) => r.json())
    .then((json) => json.items);
  entries.reverse();

  return {
    props: { entries },
  };
}

const MAX_MESSAGE_LENGTH = 350;

enum SubmissionState {
  UNSTARTED,
  SUBMITTING,
  ERRORED,
  SUCCESS,
}

const GuestbookForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const [submissionState, setSubmissionState] = useState<SubmissionState>(
    SubmissionState.UNSTARTED
  );

  const [errorMessage, setErrorMessage] = useState("");

  const messageCharactersRemaining = MAX_MESSAGE_LENGTH - message.length;

  const inputIsValid =
    messageCharactersRemaining >= 0 && name !== "" && message !== "";

  const submitButtonText = () => {
    switch (submissionState) {
      case SubmissionState.SUBMITTING:
        return "Submitting...";
      default:
        return "Submit";
    }
  };

  const submitForm = (e: any) => {
    e.preventDefault();

    setSubmissionState(SubmissionState.SUBMITTING);

    fetch("http://localhost:8080/guestbook", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, url, message }),
    })
      .then((response) => {
        return Promise.all([response, response.text()]);
      })
      .then(([response, text]) => {
        console.log(text);
        if (response.ok) {
          setSubmissionState(SubmissionState.SUCCESS);
        } else {
          setSubmissionState(SubmissionState.ERRORED);
          setErrorMessage(text);
        }
      })
      .catch((e) => {
        setSubmissionState(SubmissionState.ERRORED);
        setErrorMessage(
          `Unknown Javascript error - please get in touch! Got \`${e.message}\``
        );
      });
  };

  return (
    <div className="guestbook-form">
      {errorMessage && <p>{errorMessage}</p>}
      <form>
        <div className="form-field">
          <label htmlFor="name" className="required">
            Name:
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email (never displayed):</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="url">URL:</label>
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="message" className="required">
            Message:
          </label>
          <textarea
            style={{ height: "8rem" }}
            id="message"
            placeholder="Say something nice!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {messageCharactersRemaining < 50 &&
            messageCharactersRemaining > 1 && (
              <div className="form-message">
                {messageCharactersRemaining} characters remaining
              </div>
            )}
          {messageCharactersRemaining == 1 && (
            <div className="form-message">
              {messageCharactersRemaining} character remaining
            </div>
          )}
          {messageCharactersRemaining == 0 && (
            <div className="form-message">
              {messageCharactersRemaining} characters remaining
            </div>
          )}

          {messageCharactersRemaining < 0 && (
            <div className="form-message">
              {messageCharactersRemaining * -1} characters over limit!
            </div>
          )}
        </div>

        <button
          className="button button-primary"
          disabled={
            submissionState === SubmissionState.SUBMITTING || !inputIsValid
          }
          onClick={submitForm}
        >
          {submitButtonText()}
        </button>
      </form>
    </div>
  );
};

const fetchDynamicEntries = async (cursor: string) => {
  const entries: GuestbookEntry[] = await fetch(
    `https://api.jameslittle.me/guestbook?after=${cursor}`
  )
    .then((r) => r.json())
    .then((json) => json.items);
  entries.reverse();
  return entries;
};

export default function Guestbook({ entries }: { entries: GuestbookEntry[] }) {
  const [dynamicEntries, setDynamicEntries] = useState<GuestbookEntry[]>([]);
  const [dynamicEntriesFetched, setDynamicEntriesFetched] = useState(false);

  useEffect(() => {
    if (!dynamicEntriesFetched) {
      setDynamicEntriesFetched(true);
      fetchDynamicEntries(entries[0].id).then((newEntries) =>
        setDynamicEntries(newEntries)
      );
    }
  }, [dynamicEntriesFetched, entries]);
  return (
    <PageLayout title="Guestbook">
      <Grid>
        <FullWidth>
          <p>
            Thanks for visiting my website! If you want, please sign my
            guestbook (ya know, like it&apos;s 2007)!
          </p>
        </FullWidth>

        <Subgrid weight="right">
          <Left>
            <GuestbookForm />
          </Left>
          <Right>
            {dynamicEntries.concat(entries).map((entry) => (
              <GuestbookEntryListItem entry={entry} key={entry.id} />
            ))}
          </Right>
        </Subgrid>
      </Grid>
    </PageLayout>
  );
}

const GuestbookEntryListItem = ({ entry }: { entry: GuestbookEntry }) => {
  const [absoluteDateWidth, setAbsoluteDateWidth] = useState(0);
  const [absoluteDateVisible, setAbsoluteDateVisible] = useState(false);

  const measureAbsoluteDateRef = useCallback((node: HTMLSpanElement) => {
    if (node) {
      setAbsoluteDateWidth(node.clientWidth);
    }
  }, []);

  const dateOffset = absoluteDateVisible
    ? 0
    : `calc(${absoluteDateWidth}px + 1em)`;

  return (
    <div className="guestbook-entry-list-item">
      <div className="guestbook-entry-list-item-header">
        <span className="guestbook-entry-name">{entry.name}</span>
        <span
          className="guestbook-entry-date"
          style={{ transform: `translateX(${dateOffset})` }}
          onMouseOver={(_e) => {
            setAbsoluteDateVisible(true);
          }}
          onMouseOut={(_e) => {
            setAbsoluteDateVisible(false);
          }}
        >
          <span className="guestbook-entry-date-relative">
            {relative(entry.created_at)}
          </span>
          <span
            ref={measureAbsoluteDateRef}
            className={classNames("guestbook-entry-date-absolute", {
              "guestbook-entry-date-absolute-visible": absoluteDateVisible,
            })}
          >
            {/* <span ref={absoluteDate} className="guestbook-entry-date-absolute"> */}
            {toIso(entry.created_at)}
          </span>
        </span>
      </div>
      {entry.url && entry.url.length > 0 && (
        <div className="guestbook-entry-url">
          <a href={entry.url}>{entry.url}</a>
        </div>
      )}
      <p className="guestbook-entry-message">{entry.message}</p>
    </div>
  );
};
