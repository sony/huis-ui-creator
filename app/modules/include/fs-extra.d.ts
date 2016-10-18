// Type definitions for fs-extra
// Project: https://github.com/jprichardson/node-fs-extra
// Definitions by: midknight41 <https://github.com/midknight41>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Imported from: https://github.com/soywiz/typescript-node-definitions/fs-extra.d.ts

///<reference path="./node.d.ts"/>

declare module "fs-extra" {
	import stream = require("stream");

	export interface Stats {
		isFile(): boolean;
		isDirectory(): boolean;
		isBlockDevice(): boolean;
		isCharacterDevice(): boolean;
		isSymbolicLink(): boolean;
		isFIFO(): boolean;
		isSocket(): boolean;
		dev: number;
		ino: number;
		mode: number;
		nlink: number;
		uid: number;
		gid: number;
		rdev: number;
		size: number;
		blksize: number;
		blocks: number;
		atime: Date;
		mtime: Date;
		ctime: Date;
	}

	export interface FSWatcher {
		close(): void;
	}

	export class ReadStream extends stream.Readable { }
	export class WriteStream extends stream.Writable { }

	//extended methods
	export function copy(src: string, dest: string, callback?: (err: Error) => void): void;
	export function copy(src: string, dest: string, filter: (src: string) => boolean, callback?: (err: Error) => void): void;
	export function copy(src: string, dest: string, options: CopyOptions, callback?: (err: Error) => void): void;

	export function copySync(src: string, dest: string): void;
	export function copySync(src: string, dest: string, filter: (src: string) => boolean): void;
	export function copySync(src: string, dest: string, options: CopyOptions): void;

	export function createFile(file: string, callback?: (err: Error) => void): void;
	export function createFileSync(file: string): void;

	export function mkdirs(dir: string, callback?: (err: Error) => void): void;
	export function mkdirp(dir: string, callback?: (err: Error) => void): void;
	export function mkdirs(dir: string, options?: MkdirOptions, callback?: (err: Error) => void): void;
	export function mkdirp(dir: string, options?: MkdirOptions, callback?: (err: Error) => void): void;
	export function mkdirsSync(dir: string, options?: MkdirOptions): void;
	export function mkdirpSync(dir: string, options?: MkdirOptions): void;

	export function outputFile(file: string, data: any, callback?: (err: Error) => void): void;
	export function outputFileSync(file: string, data: any): void;

	export function outputJson(file: string, data: any, callback?: (err: Error) => void): void;
	export function outputJSON(file: string, data: any, callback?: (err: Error) => void): void;
	export function outputJsonSync(file: string, data: any, options?: any): void;
	export function outputJSONSync(file: string, data: any, options?: any): void;

	export function readJson(file: string, callback?: (err: Error) => void): void;
	export function readJson(file: string, options?: OpenOptions, callback?: (err: Error) => void): void;
	export function readJSON(file: string, callback?: (err: Error) => void): void;
	export function readJSON(file: string, options?: OpenOptions, callback?: (err: Error) => void): void;

	export function readJsonSync(file: string, options?: OpenOptions): void;
	export function readJSONSync(file: string, options?: OpenOptions): void;

	export function remove(dir: string, callback?: (err: Error) => void): void;
	export function removeSync(dir: string): void;
	// export function delete(dir: string, callback?: (err: Error) => void): void;
	// export function deleteSync(dir: string): void;

	export function writeJson(file: string, object: any, callback?: (err: Error) => void): void;
	export function writeJson(file: string, object: any, options?: OpenOptions, callback?: (err: Error) => void): void;
	export function writeJSON(file: string, object: any, callback?: (err: Error) => void): void;
	export function writeJSON(file: string, object: any, options?: OpenOptions, callback?: (err: Error) => void): void;

	export function writeJsonSync(file: string, object: any, options?: OpenOptions): void;
	export function writeJSONSync(file: string, object: any, options?: OpenOptions): void;

	export function rename(oldPath: string, newPath: string, callback?: (err: Error) => void): void;
	export function renameSync(oldPath: string, newPath: string): void;
	export function truncate(fd: number, len: number, callback?: (err: Error) => void): void;
	export function truncateSync(fd: number, len: number): void;
	export function chown(path: string, uid: number, gid: number, callback?: (err: Error) => void): void;
	export function chownSync(path: string, uid: number, gid: number): void;
	export function fchown(fd: number, uid: number, gid: number, callback?: (err: Error) => void): void;
	export function fchownSync(fd: number, uid: number, gid: number): void;
	export function lchown(path: string, uid: number, gid: number, callback?: (err: Error) => void): void;
	export function lchownSync(path: string, uid: number, gid: number): void;
	export function chmod(path: string, mode: number, callback?: (err: Error) => void): void;
	export function chmod(path: string, mode: string, callback?: (err: Error) => void): void;
	export function chmodSync(path: string, mode: number): void;
	export function chmodSync(path: string, mode: string): void;
	export function fchmod(fd: number, mode: number, callback?: (err: Error) => void): void;
	export function fchmod(fd: number, mode: string, callback?: (err: Error) => void): void;
	export function fchmodSync(fd: number, mode: number): void;
	export function fchmodSync(fd: number, mode: string): void;
	export function lchmod(path: string, mode: string, callback?: (err: Error) => void): void;
	export function lchmod(path: string, mode: number, callback?: (err: Error) => void): void;
	export function lchmodSync(path: string, mode: number): void;
	export function lchmodSync(path: string, mode: string): void;
	export function stat(path: string, callback?: (err: Error, stats: Stats) => void): void;
	export function lstat(path: string, callback?: (err: Error, stats: Stats) => void): void;
	export function fstat(fd: number, callback?: (err: Error, stats: Stats) => void): void;
	export function statSync(path: string): Stats;
	export function lstatSync(path: string): Stats;
	export function fstatSync(fd: number): Stats;
	export function link(srcpath: string, dstpath: string, callback?: (err: Error) => void): void;
	export function linkSync(srcpath: string, dstpath: string): void;
	export function symlink(srcpath: string, dstpath: string, type?: string, callback?: (err: Error) => void): void;
	export function symlinkSync(srcpath: string, dstpath: string, type?: string): void;
	export function readlink(path: string, callback?: (err: Error, linkString: string) => void): void;
	export function realpath(path: string, callback?: (err: Error, resolvedPath: string) => void): void;
	export function realpath(path: string, cache: string, callback: (err: Error, resolvedPath: string) => void): void;
	export function realpathSync(path: string, cache?: boolean): string;
	export function unlink(path: string, callback?: (err: Error) => void): void;
	export function unlinkSync(path: string): void;
	export function rmdir(path: string, callback?: (err: Error) => void): void;
	export function rmdirSync(path: string): void;
	export function mkdir(path: string, mode?: number, callback?: (err: Error) => void): void;
	export function mkdir(path: string, mode?: string, callback?: (err: Error) => void): void;
	export function mkdirSync(path: string, mode?: number): void;
	export function mkdirSync(path: string, mode?: string): void;
	export function readdir(path: string, callback?: (err: Error, files: string[]) => void ): void;
	export function readdirSync(path: string): string[];
	export function close(fd: number, callback?: (err: Error) => void): void;
	export function closeSync(fd: number): void;
	export function open(path: string, flags: string, mode?: string, callback?: (err: Error, fs: number) => void): void;
	export function openSync(path: string, flags: string, mode?: string): number;
	export function utimes(path: string, atime: number, mtime: number, callback?: (err: Error) => void): void;
	export function utimesSync(path: string, atime: number, mtime: number): void;
	export function futimes(fd: number, atime: number, mtime: number, callback?: (err: Error) => void): void;
	export function futimesSync(fd: number, atime: number, mtime: number): void;
	export function fsync(fd: number, callback?: (err: Error) => void): void;
	export function fsyncSync(fd: number): void;
	export function write(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number, callback?: (err: Error, written: number, buffer: NodeBuffer) => void): void;
	export function writeSync(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number): number;
	export function read(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number, callback?: (err: Error, bytesRead: number, buffer: NodeBuffer) => void ): void;
	export function readSync(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number): number;
	export function readFile(filename: string, encoding: string, callback: (err: Error, data: string) => void ): void;
	export function readFile(filename: string, options: OpenOptions, callback: (err: Error, data: string) => void ): void;
	export function readFile(filename: string, callback: (err: Error, data: NodeBuffer) => void ): void;
	export function readFileSync(filename: string): NodeBuffer;
	export function readFileSync(filename: string, encoding: string): string;
	export function readFileSync(filename: string, options: OpenOptions): string;
	export function writeFile(filename: string, data: any, encoding?: string, callback?: (err: Error) => void): void;
	export function writeFile(filename: string, data: any, options?: OpenOptions, callback?: (err: Error) => void): void;
	export function writeFileSync(filename: string, data: any, encoding?: string): void;
	export function writeFileSync(filename: string, data: any, option?: OpenOptions): void;
	export function appendFile(filename: string, data: any, encoding?: string, callback?: (err: Error) => void): void;
	export function appendFile(filename: string, data: any,option?: OpenOptions, callback?: (err: Error) => void): void;
	export function appendFileSync(filename: string, data: any, encoding?: string): void;
	export function appendFileSync(filename: string, data: any, option?: OpenOptions): void;
	export function watchFile(filename: string, listener: { curr: Stats; prev: Stats; }): void;
	export function watchFile(filename: string, options: { persistent?: boolean; interval?: number; }, listener: { curr: Stats; prev: Stats; }): void;
	export function unwatchFile(filename: string, listener?: Stats): void;
	export function watch(filename: string, options?: { persistent?: boolean; }, listener?: (event: string, filename: string) => any): FSWatcher;
	export function exists(path: string, callback?: (exists: boolean) => void ): void;
	export function existsSync(path: string): boolean;
    export function ensureDir(path: string, cb: (err: Error) => void): void;

    export interface CopyFilterFunction {
		(src: string): boolean
	}

	export type CopyFilter = CopyFilterFunction | RegExp;

	export interface CopyOptions {
		clobber?: boolean
		preserveTimestamps?: boolean
        dereference?: boolean
		filter?: CopyFilter
	}

	export interface OpenOptions {
		encoding?: string;
		flag?: string;
	}

	export interface MkdirOptions {
		fs?: any;
		mode?: number;
	}

	export interface ReadStreamOptions {
		flags?: string;
		encoding?: string;
		fd?: number;
		mode?: number;
		bufferSize?: number;
	}
	export interface WriteStreamOptions {
		flags?: string;
		encoding?: string;
		string?: string;
	}
	export function createReadStream(path: string, options?: ReadStreamOptions): ReadStream;
	export function createWriteStream(path: string, options?: WriteStreamOptions): WriteStream;
}

interface FSE {
	//extended methods
	copy(src: string, dest: string, callback?: (err: Error) => void): void;
	copy(src: string, dest: string, filter: (src: string) => boolean, callback?: (err: Error) => void): void;
	copy(src: string, dest: string, options: CopyOptions, callback?: (err: Error) => void): void;

	copySync(src: string, dest: string): void;
	copySync(src: string, dest: string, filter: (src: string) => boolean): void;
	copySync(src: string, dest: string, options: CopyOptions): void;

	createFile(file: string, callback?: (err: Error) => void): void;
	createFileSync(file: string): void;

	mkdirs(dir: string, callback?: (err: Error) => void): void;
	mkdirp(dir: string, callback?: (err: Error) => void): void;
	mkdirs(dir: string, options?: MkdirOptions, callback?: (err: Error) => void): void;
	mkdirp(dir: string, options?: MkdirOptions, callback?: (err: Error) => void): void;
	mkdirsSync(dir: string, options?: MkdirOptions): void;
	mkdirpSync(dir: string, options?: MkdirOptions): void;

	outputFile(file: string, data: any, callback?: (err: Error) => void): void;
	outputFileSync(file: string, data: any): void;

	outputJson(file: string, data: any, callback?: (err: Error) => void): void;
	outputJSON(file: string, data: any, callback?: (err: Error) => void): void;
	outputJsonSync(file: string, data: any, options?: any): void;
	outputJSONSync(file: string, data: any, options?: any): void;

	readJson(file: string, callback?: (err: Error) => void): void;
	readJson(file: string, options?: OpenOptions, callback?: (err: Error) => void): void;
	readJSON(file: string, callback?: (err: Error) => void): void;
	readJSON(file: string, options?: OpenOptions, callback?: (err: Error) => void): void;

	readJsonSync(file: string, options?: OpenOptions): any;
	readJSONSync(file: string, options?: OpenOptions): any;

	remove(dir: string, callback?: (err: Error) => void): void;
	removeSync(dir: string): void;

	writeJson(file: string, object: any, callback?: (err: Error) => void): void;
	writeJson(file: string, object: any, options?: OpenOptions, callback?: (err: Error) => void): void;
	writeJSON(file: string, object: any, callback?: (err: Error) => void): void;
	writeJSON(file: string, object: any, options?: OpenOptions, callback?: (err: Error) => void): void;

	writeJsonSync(file: string, object: any, options?: OpenOptions): void;
	writeJSONSync(file: string, object: any, options?: OpenOptions): void;

	rename(oldPath: string, newPath: string, callback?: (err: Error) => void): void;
	renameSync(oldPath: string, newPath: string): void;
	truncate(fd: number, len: number, callback?: (err: Error) => void): void;
	truncateSync(fd: number, len: number): void;
	chown(path: string, uid: number, gid: number, callback?: (err: Error) => void): void;
	chownSync(path: string, uid: number, gid: number): void;
	fchown(fd: number, uid: number, gid: number, callback?: (err: Error) => void): void;
	fchownSync(fd: number, uid: number, gid: number): void;
	lchown(path: string, uid: number, gid: number, callback?: (err: Error) => void): void;
	lchownSync(path: string, uid: number, gid: number): void;
	chmod(path: string, mode: number, callback?: (err: Error) => void): void;
	chmod(path: string, mode: string, callback?: (err: Error) => void): void;
	chmodSync(path: string, mode: number): void;
	chmodSync(path: string, mode: string): void;
	fchmod(fd: number, mode: number, callback?: (err: Error) => void): void;
	fchmod(fd: number, mode: string, callback?: (err: Error) => void): void;
	fchmodSync(fd: number, mode: number): void;
	fchmodSync(fd: number, mode: string): void;
	lchmod(path: string, mode: string, callback?: (err: Error) => void): void;
	lchmod(path: string, mode: number, callback?: (err: Error) => void): void;
	lchmodSync(path: string, mode: number): void;
	lchmodSync(path: string, mode: string): void;
	stat(path: string, callback?: (err: Error, stats: Stats) => void): void;
	lstat(path: string, callback?: (err: Error, stats: Stats) => void): void;
	fstat(fd: number, callback?: (err: Error, stats: Stats) => void): void;
	statSync(path: string): Stats;
	lstatSync(path: string): Stats;
	fstatSync(fd: number): Stats;
	link(srcpath: string, dstpath: string, callback?: (err: Error) => void): void;
	linkSync(srcpath: string, dstpath: string): void;
	symlink(srcpath: string, dstpath: string, type?: string, callback?: (err: Error) => void): void;
	symlinkSync(srcpath: string, dstpath: string, type?: string): void;
	readlink(path: string, callback?: (err: Error, linkString: string) => void): void;
	realpath(path: string, callback?: (err: Error, resolvedPath: string) => void): void;
	realpath(path: string, cache: string, callback: (err: Error, resolvedPath: string) => void): void;
	realpathSync(path: string, cache?: boolean): string;
	unlink(path: string, callback?: (err: Error) => void): void;
	unlinkSync(path: string): void;
	rmdir(path: string, callback?: (err: Error) => void): void;
	rmdirSync(path: string): void;
	mkdir(path: string, mode?: number, callback?: (err: Error) => void): void;
	mkdir(path: string, mode?: string, callback?: (err: Error) => void): void;
	mkdirSync(path: string, mode?: number): void;
	mkdirSync(path: string, mode?: string): void;
	readdir(path: string, callback?: (err: Error, files: string[]) => void): void;
	readdirSync(path: string): string[];
	close(fd: number, callback?: (err: Error) => void): void;
	closeSync(fd: number): void;
	open(path: string, flags: string, mode?: string, callback?: (err: Error, fs: number) => void): void;
	openSync(path: string, flags: string, mode?: string): number;
	utimes(path: string, atime: number, mtime: number, callback?: (err: Error) => void): void;
	utimesSync(path: string, atime: number, mtime: number): void;
	futimes(fd: number, atime: number, mtime: number, callback?: (err: Error) => void): void;
	futimesSync(fd: number, atime: number, mtime: number): void;
	fsync(fd: number, callback?: (err: Error) => void): void;
	fsyncSync(fd: number): void;
	write(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number, callback?: (err: Error, written: number, buffer: NodeBuffer) => void): void;
	writeSync(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number): number;
	read(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number, callback?: (err: Error, bytesRead: number, buffer: NodeBuffer) => void): void;
	readSync(fd: number, buffer: NodeBuffer, offset: number, length: number, position: number): number;
	readFile(filename: string, encoding: string, callback: (err: Error, data: string) => void): void;
	readFile(filename: string, options: OpenOptions, callback: (err: Error, data: string) => void): void;
	readFile(filename: string, callback: (err: Error, data: NodeBuffer) => void): void;
	readFileSync(filename: string): NodeBuffer;
	readFileSync(filename: string, encoding: string): string;
	readFileSync(filename: string, options: OpenOptions): string;
	writeFile(filename: string, data: any, encoding?: string, callback?: (err: Error) => void): void;
	writeFile(filename: string, data: any, options?: OpenOptions, callback?: (err: Error) => void): void;
	writeFileSync(filename: string, data: any, encoding?: string): void;
	writeFileSync(filename: string, data: any, option?: OpenOptions): void;
	appendFile(filename: string, data: any, encoding?: string, callback?: (err: Error) => void): void;
	appendFile(filename: string, data: any, option?: OpenOptions, callback?: (err: Error) => void): void;
	appendFileSync(filename: string, data: any, encoding?: string): void;
	appendFileSync(filename: string, data: any, option?: OpenOptions): void;
	watchFile(filename: string, listener: { curr: Stats; prev: Stats; }): void;
	watchFile(filename: string, options: { persistent?: boolean; interval?: number; }, listener: { curr: Stats; prev: Stats; }): void;
	unwatchFile(filename: string, listener?: Stats): void;
	//watch(filename: string, options?: { persistent?: boolean; }, listener?: (event: string, filename: string) => any): FSWatcher;
	exists(path: string, callback?: (exists: boolean) => void): void;
	existsSync(path: string): boolean;
	ensureDir(path: string, cb: (err: Error) => void): void;
	move(src: string, dest: string, callback?: (err: Error) => void): void;
	
}

interface CopyFilterFunction {
	(src: string): boolean
}

type CopyFilter = CopyFilterFunction | RegExp;

interface CopyOptions {
	clobber?: boolean
	preserveTimestamps?: boolean
	dereference?: boolean
	filter?: CopyFilter
}

interface Stats {
	isFile(): boolean;
	isDirectory(): boolean;
	isBlockDevice(): boolean;
	isCharacterDevice(): boolean;
	isSymbolicLink(): boolean;
	isFIFO(): boolean;
	isSocket(): boolean;
	dev: number;
	ino: number;
	mode: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	size: number;
	blksize: number;
	blocks: number;
	atime: Date;
	mtime: Date;
	ctime: Date;
}

interface OpenOptions {
	encoding?: string;
	flag?: string;
}

interface MkdirOptions {
	fs?: any;
	mode?: number;
}

interface ReadStreamOptions {
	flags?: string;
	encoding?: string;
	fd?: number;
	mode?: number;
	bufferSize?: number;
}
interface WriteStreamOptions {
	flags?: string;
	encoding?: string;
	string?: string;
}

declare var fs: FSE;
