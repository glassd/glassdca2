import { Link } from "react-router";

interface ProjectCardProps {
  title: string;
  image: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
}

export function ProjectCard({
  title,
  image,
  description,
  liveUrl,
  githubUrl,
}: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full transition-transform hover:scale-[1.02]">
      <div className="h-48 overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500">No Image</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 grow line-clamp-3">
          {description}
        </p>
        <div className="flex space-x-4 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center"
            >
              Live Demo
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white flex items-center"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
