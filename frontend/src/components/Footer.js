export default function Footer({ isFunniesMode = false }) {
  const footerClassName = isFunniesMode
    ? "text-center py-4 w-full mt-4 relative bg-black text-[#f6f1e4]"
    : "text-center py-4 w-full mt-4 relative";

  const linkClassName = isFunniesMode ? "text-[#c1121f]" : "text-accent";

  return (
    <footer className={footerClassName}>
      <div className="md:absolute md:right-4 md:text-light-gray text-sm md:text-base">
        v1.1.0
      </div>
      <div className="text-sm md:text-base mt-2 md:mt-0">
        Made by
        <a
          href="https://github.com/aleburbridge"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          {" "}
          Alex Bridgeman
        </a>{" "}
        &
        <a
          href="https://github.com/Chris-Perkins"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          {" "}
          Nep Perkins
        </a>
      </div>
    </footer>
  );
}
