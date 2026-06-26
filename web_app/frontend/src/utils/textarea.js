let textarea = null;

export function resizeTextarea(textareaRef = null) {

    if (textareaRef)
        textarea = textareaRef.current;

    if (!textarea)
        return;

    const MIN_HEIGHT = 95;
    const MAX_HEIGHT = 220;

    textarea.style.height = `${MIN_HEIGHT}px`;

    const newHeight = Math.min(

        textarea.scrollHeight,

        MAX_HEIGHT

    );

    textarea.style.height = `${newHeight}px`;

    if (textarea.scrollHeight > MAX_HEIGHT)
        textarea.style.overflowY = "auto";
    else
        textarea.style.overflowY = "hidden";

}