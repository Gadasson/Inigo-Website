type Props = {
  id: string;
  text: string;
};

export default function StudioFieldHint({ id, text }: Props) {
  return (
    <span className="studio-field-hint">
      <button
        type="button"
        className="studio-field-hint__btn"
        aria-label="Field help"
        aria-describedby={id}
      >
        i
      </button>
      <span id={id} role="tooltip" className="studio-field-hint__tooltip">
        {text}
      </span>
    </span>
  );
}
