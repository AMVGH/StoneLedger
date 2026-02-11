import logo from "../assets/mountain.png";


export default function Logo({ size = 44 }) {
  return (
    <img
      src={logo}
      alt="App Logo"
      style={{ width: size, height: "auto" }}
    />
  );
}
