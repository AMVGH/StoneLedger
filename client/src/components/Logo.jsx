import logo from "../assets/StoneLedgerLogo-removebg-preview (1).png";


export default function Logo({ size = 40 }) {
  return (
    <img
      src={logo}
      alt="App Logo"
      style={{ width: size, height: "auto" }}
    />
  );
}
