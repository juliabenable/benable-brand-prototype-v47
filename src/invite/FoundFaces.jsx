import { FOUND_FACES } from './rounds.js';
import './foundFaces.css';

/* Day 3 "We Found 75 creators" card: a small stack of blurred faces from the
   list instead of one (Julia, Oct 22). Figma 7199:21448 drew one circle for a
   one-creator example. Same faces as the popup's Previously approved bar. */
export default function FoundFaces() {
  return (
    <span className="ff-stack" aria-hidden="true">
      {FOUND_FACES.map((src) => (
        <span key={src} className="ff-face"><img src={src} alt="" /></span>
      ))}
    </span>
  );
}
