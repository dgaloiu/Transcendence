function Field (field:string)
{
	const HaveSameValue = (elementToCompare) => {
		const Comparator = (elementCompared) => elementCompared[field] === elementToCompare[field];
		return (Comparator);
	};

	const EqualeTo = (value) => {
		const Comparator = (elementCompared) => elementCompared[field] === value;
		return (Comparator);
	};
	return ({
		HaveSameValue,
		EqualeTo
	});
};



interface Wrapper<Type> {
	():Type | Type | undefined;
}

//type String = string | () => string | undefined

type Header = {
	name:string;
	value:String;
}

type String = Wrapper<string>;
//type Header = Wrapper<header>; //header | () => header | undefined

async function unwrappe<Type extends Wrapper>(input:Type): any | undefined
{
	return ((typeof input === "function" ) ? await input() : input);
}


export interface fetchOption
{
	base_url?:string;
	headers?:Header[];
}

export function request(route:string)
{
	var _headers = [];

	function metod(method:string)
	{
		return (async (url:string, body?:any) => {
			const options = { method, headers:{} };

			if (body) {
				options.body = body;
			}

			const UnwrappeAndSetHeader = async ({ name, value }) => {
				options.headers[name] = await unwrappe(value);
			};
			await Promise.all(_headers.map(UnwrappeAndSetHeader));
			const _url = `${route}${url || ''}`;
			return fetch(_url, options);//.then(handleResponse);
		});
	}

	const buildMethode = () => {
		return ({
			get:	metod('GET'),
			post:	metod('POST'),
			put:	metod('PUT'),
			delete:	metod('DELETE'),
		});
	};

	const extended_request = (url?:string) => {
		return (request(`${route}${url || ''}`).headers(_headers));
	};

	function headers(headersCallback:any[])
	{
		const ShareSameHeaderName = (headerToCompare) => Field('name').HaveSameValue(headerToCompare);
		headersCallback.forEach((element) => {
			const indexFound = _headers.findIndex(ShareSameHeaderName(element));
			if (indexFound === -1)
				_headers.push(element);
			else
				_headers.splice(indexFound, 1, element);
		});
		return ({
			...buildMethode(),
			request: extended_request,
			headers: headers,
		})
	}

	return {
		...buildMethode(),
		request: extended_request,
		headers: headers,
	}
}
