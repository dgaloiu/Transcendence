

export function makeObject(array:any[], builder) {
	const obj = array.reduce((result, arg) => {
		const [name, value] = builder(arg);
		return ({
			...result,
			[name]: value,
		})
	}, {} as { [name: string]:any });
	return (obj);
}

