export default function Footer() {
    return (
        <footer className="bg-white py-4 position-fixed bottom-0 w-full text-center w-full  shadow-sm border-b border-gray-200">
            <div className="container mx-auto text-center ">
            <p className="px-3 py-1 rounded-lg text-gray-700  hover:text-red-600 transition text-md">
                &copy; {new Date().getFullYear()} Medicare. All rights reserved.
                </p>
            </div>
        </footer>
    );
}