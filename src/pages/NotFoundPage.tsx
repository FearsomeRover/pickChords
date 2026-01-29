import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl m-0">404</h1>
      <h2 className="mt-4">Page Not Found</h2>
      <p className="mt-4 text-light-gray">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/chords"
        className="mt-8 px-5 py-2.5 text-base rounded-lg font-medium bg-deep-navy text-off-white transition-all duration-200 hover:bg-[#001a3d] hover:shadow-[0_4px_12px_rgba(0,22,45,0.3)] no-underline"
      >
        Go to Chords
      </Link>
    </div>
  )
}

export default NotFoundPage
