'use client';

import {
  AlertTriangle as AlertTriangleIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  Book as BookIcon,
  BookOpen,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  File as FileIcon,
  Folder as FolderIcon,
  HelpCircle as HelpCircleIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  X as XIcon,
} from 'lucide-react';

const iconClass = 'size-4';

export const BookOpenIcon = BookOpen;
export const Book = () => <BookIcon className={iconClass} />;
export const Home = () => <HomeIcon className={iconClass} />;
export const Code = () => <CodeIcon className={iconClass} />;
export const File = () => <FileIcon className={iconClass} />;
export const Folder = () => <FolderIcon className={iconClass} />;
export const Search = () => <SearchIcon className={iconClass} />;
export const Link = () => <LinkIcon className={iconClass} />;
export const Plus = () => <PlusIcon className={iconClass} />;
export const Pencil = () => <EditIcon className={iconClass} />;
export const Check = () => <CheckIcon className={iconClass} />;
export const X = () => <XIcon className={iconClass} />;
export const ArrowRight = () => <ArrowRightIcon className={iconClass} />;
export const ChevronDown = () => <ChevronDownIcon className={iconClass} />;
export const Info = () => <InfoIcon className={iconClass} />;
export const HelpCircle = () => <HelpCircleIcon className={iconClass} />;
export const AlertTriangle = () => <AlertTriangleIcon className={iconClass} />;
