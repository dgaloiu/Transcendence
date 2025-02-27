
type Predicat = (any)=>boolean;
type Comparaison = (any)=>Predicat;


export{}
declare global {
	interface Array<T> {
		addUniqueBy(compare:Comparaison): (src:T | T[]) => T[];
		removeBy(by:Predicat): void;
	}
}

if (!Array.prototype.addUniqueBy) {
	Array.prototype.addUniqueBy = function addUniqueBy<T>(this: T[], compare:Comparaison): ((src:T | T[]) => T[]) {
		const add = (element:T) => {
			if (!this.some(compare(element)))
				this.push(element);
		}
		const apply = (src: T | T[]): T[] => {
			if (!Array.isArray(src))
				src = [src];
			src.forEach(add);
			return(src);
		};
		return (apply);
	};
}

if (!Array.prototype.removeBy) {
	Array.prototype.removeBy = function removeBy<T>(this: T[], by:Predicat): void {
		const indexFound = this.findIndex(by);
		if (indexFound !== -1)
			this.splice(indexFound, 1);
	};
}

/*
const In = (dest:any[]) => ({
	addUniqueBy: (compare:Comparaison) => {
		const add = (element:any) => {
			if (!dest.some(compare(element)))
				dest.push(element);
		}
		return ((src:any | any[]) => {
			if (Array.isArray(src))
				src.forEach(add);
			else
				add(src);
			return(src);
		});
	},
	removeBy: (by:Predicat):void => {
		const indexFound = dest.findIndex(by);
		if (indexFound !== -1)
			dest.splice(indexFound, 1);
	}
})
*/

export const Field = (name:string) => ({
	same: (a:any) => (b:any) => (a[name] === b[name]),
	equal: (value:any) => (b:any) => (value === b[name])
})

export const Same = {
	field: (name:string) => (a:any) => (b:any) => (a[name] === b[name])
}
