import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'

function store()
{
	const showPopup = ref(false);
	const contentPopup = reactive({});
	var _onClosed = () => {};
	function close() { showPopup.value = false }
	function closed() {
		_onClosed();
		showPopup.value = false
	}
	function emit(title:string, content:string, onClosed?) {
		if (onClosed)
			_onClosed = onClosed;
		contentPopup.value = {title, content};
		showPopup.value = true;
		return (close);
	}

	return {
		show: computed(() => showPopup.value),
		content: computed(() => contentPopup.value),
		close, closed,
		emit,
	};
}
export const usePopupStore = defineStore('popup', store);
