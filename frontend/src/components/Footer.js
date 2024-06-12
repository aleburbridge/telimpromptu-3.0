export default function Footer() {
    return (
        <footer className="text-center py-4 w-full mt-4 relative">
            <div className="md:absolute md:right-4 md:text-light-gray text-sm md:text-base">
                v1.0.2
            </div>
            <div className="text-sm md:text-base mt-2 md:mt-0">
                Made by 
                <a href="https://github.com/aleburbridge" target='_blank' rel="noreferrer" className="text-accent"> Alex Bridgeman </a> 
                & 
                <a href="https://github.com/Chris-Perkins" target='_blank' rel="noreferrer" className="text-accent"> Nep Perkins</a>
            </div>
        </footer>
    );
}
