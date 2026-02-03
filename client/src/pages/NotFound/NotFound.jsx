import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Page Not Found</h2>
        <Link className="link" to="/">Go back to Welcome</Link>
      </div>
    </div>
  );
}
