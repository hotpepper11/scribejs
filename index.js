// Configuration for the page sizes. Max page height is not here because it needs a function.
const leftPadding = 0.5 * 96;
const rightPadding = 0.5 * 96;
const topPadding = 0.75 * 96;
const bottomPadding = 1 * 96;
const pageWidth = (8.5 * 96) - leftPadding - rightPadding;
const bookTitle = 'A collection of public writings';

const getPrintingHeight = (element) => {
    // Could also be called 'shell-ement';
    const shellElement = document.createElement('div');

    shellElement.append(element.cloneNode(true));

    shellElement.style.maxWidth = `${pageWidth}px`;

    document.body.append(shellElement);

    // const computedStyle = getComputedStyle(shellElement);
    // const marginTop = parseFloat(computedStyle.marginTop);
    // const marginBottom = parseFloat(computedStyle.marginBottom);
    // const height = shellElement.offsetHeight + marginTop + marginBottom;
    // const height = shellElement.getBoundingClientRect().height;

    const height = shellElement.offsetHeight;

    shellElement.remove();

    return height;
};

const getElementStartTag = (element) => {
    const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`);
    const startTag = `<${element.tagName} ${attributes.join(' ')}>`;
    return startTag;
}

// Footer
const footer = { html: (props) => `<div style="background-color: red; text-align: center; page-break-after: always;"><b>Page ${props.pageNumber} of <span id="total-pages"></span></b></div>` };
const footerElement = document.createElement('div');
footerElement.innerHTML = footer.html({ pageNumber: 0 });
footer.height = getPrintingHeight(footerElement);
// footer.height = 19;

// Header
const header = { html: (props) => props.pageNumber % 2 == 0 ? `<div style="max-width: ${pageWidth}px; background-color: green; text-overflow: ellipsis; text-align: right;">${props.chapterName}</div>` : `<div style="background-color: green;">${bookTitle}</div>` };

let headerElement = document.createElement('div');
headerElement.innerHTML = header.html({ pageNumber: 0, chapterName: 'TODO header' });
header.height = getPrintingHeight(headerElement);
// header.height = 19;

// Max page height is here because it needs the footer and header height
// let maxPageHeight = (11 * 96) - (topPadding + bottomPadding + footer.height + header.height);
let maxPageHeight = 868; // 867-870
console.log(maxPageHeight,bottomPadding, topPadding)
const content = document.getElementById('body');
let currentChapterName = 'TODO chapter name'; // TODO: Change in the loop

headerElement = document.createElement('div');
headerElement.innerHTML = header.html({ pageNumber: 1, chapterName: currentChapterName });

const pages = [[headerElement]];

class ChangingVariables {
    constructor(currentPageHeight) {
        this.currentPageHeight = currentPageHeight;
    }
}

// const changingVariables = new ChangingVariables(header.height);
const changingVariables = new ChangingVariables(0);

const addElementToCurrentPage = (pages, element, elementHeight = getPrintingHeight(element)) => {
    pages[pages.length - 1].push(element);
    changingVariables.currentPageHeight += elementHeight;

    return changingVariables.currentPageHeight;
};

const addNewPage = (pages, currentChapterName) => {
    const footerElement = document.createElement('div');
    footerElement.innerHTML = footer.html({ pageNumber: pages.length });

    const headerElement = document.createElement('div');
    headerElement.innerHTML = header.html({ pageNumber: pages.length + 1, chapterName: currentChapterName });

    pages[pages.length - 1].push(...[footerElement]);
    pages.push([headerElement]);

    // changingVariables.currentPageHeight = header.height;
    changingVariables.currentPageHeight = 0;
};

const subDivideString = (string, maxPageHeight) => {
    const string1 = [];
    const string2 = [];

    let atMaxHeight = false;

    string.split(' ').forEach((word) => {
        const pereivedStrLength = atMaxHeight ? 0 : getPrintingHeight(document.createTextNode([...string1, word].join(' ')));

        if (!atMaxHeight && (changingVariables.currentPageHeight + pereivedStrLength) <= maxPageHeight) {
            string1.push(word);
        } else {
            if (!atMaxHeight) {
                // console.log('end page', changingVariables.currentPageHeight, changingVariables.currentPageHeight + pereivedStrLength, maxPageHeight);
            }
            string2.push(word);
            atMaxHeight = true;
        }
    });

    return [string1.join(' '), string2.join(' ')];
};

const divideTextOverPages = (textNode, pages, currentChapterName, textNodeHeight = getPrintingHeight(textNode)) => {
    let finished = false;
    let string1 = '';
    let string2 = textNode.textContent;
    let string2Height = textNodeHeight;

    while ((changingVariables.currentPageHeight + string2Height) >= maxPageHeight) {
        [string1, string2] = subDivideString(string2, maxPageHeight);

        const div = document.createElement('div');
        div.appendChild(document.createTextNode(string1));

        addElementToCurrentPage(pages, div);
        addNewPage(pages, currentChapterName, changingVariables.currentPageHeight);

        string2Height = getPrintingHeight(document.createTextNode(string2));
    }

    const string2Element = document.createTextNode(string2)

    // changingVariables.currentPageHeight = 0;
    changingVariables.currentPageHeight = addElementToCurrentPage(pages, string2Element);
};

// Note: This does not support text list elements that are larger than a page
const divideListOverPages = (listNode, pages, currentChapterName, page1Html, page2Html) => {
    // if (elementType === 'ol') {
        console.error('This man right here officer. He put an ol in the html. Not supported yet.');
    // }

    // // Unordered list
    // else {
    //     page1Html += getElementStartTag(listNode);
    //     let atMaxHeight = false;

    //     element.children.forEach((child) => {
    //         if (!atMaxHeight) const childHeight = getPrintingHeight(child);

    //         if ((changingVariables.currentPageHeight + childHeight) < maxPageHeight && !atMaxHeight) {
    //             addElementToCurrentPage(pages, child);

    //         } else {
    //             // Split list element, which could contain other lists.
    //             atMaxHeight = true;
    //             let childIsList = false;

    //             child.childNodes.forEach((listElementChild) => {
    //                 if (['UL', 'OL'].includes(listElementChild.nodeName)) {
    //                     divideListOverPages(listElementChild, pages, currentChapterName, changingVariables.currentPageHeight);
    //                     childIsList = true;
    //                 }
    //             });

    //             if (!childIsList) {
    //                 addNewPage(pages, currentChapterName, changingVariables.currentPageHeight);
    //                 addElementToCurrentPage(pages, child);
    //             }
    //         }
    //     });
    // }
};

const splitContainer = (element, pages, currentChapterName) => {
    // Subdivide element //
    const elementType = element.nodeName.toLowerCase();

    let mode;
    const moveToNextPageMode = 'move to next page';
    const splitContainerMode = 'split container';
    const listMode = 'list mode'; // Just for lists

    switch (elementType) {
        case 'br':
        case 'a':
        case 'button':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
        case 'hr':
        case 'img':
            mode = moveToNextPageMode;
            break;

        case 'b':
        case 'div':
        case 'em':
        case 'i':
        case 'p':
        case 's':
        case 'span':
        case 'strike':
        case 'u':
            mode = splitContainerMode;
            break;

        case 'ol':
        case 'ul':
            mode = listMode;
            break;

        default:
            console.error(`This element type (${elementType}) is not supported currently.`);
            break;
    }

    switch (mode) {
        case moveToNextPageMode:
            addNewPage(pages, currentChapterName, changingVariables.currentPageHeight);
            addElementToCurrentPage(pages, element);
            break;

        case splitContainerMode:
            // CARRY OVER STYLESS!! Consider min-height or height 
            element.childNodes.forEach((elementChild) => {
                if (elementChild.nodeName === '#text') divideTextOverPages(elementChild, pages, currentChapterName);

                else {
                    splitContainer(elementChild, pages, currentChapterName);
                }
            });
            break;

        case listMode:
            divideListOverPages(element);
            break;
    }
};

content.childNodes.forEach((child) => {
    const childHeight = getPrintingHeight(child);

    if ((changingVariables.currentPageHeight + childHeight) >= maxPageHeight) {
        // For text nodes, split into words and divide words
        if (child.nodeName == '#text') {
            divideTextOverPages(child, pages, currentChapterName, childHeight);
        }

        // For elements, divide children and the text inside the children
        else {
            let atMaxHeight = false;

            child.childNodes.forEach((grandChild) => {
                const grandChildHeight = atMaxHeight ? 0 : getPrintingHeight(grandChild);

                if (!atMaxHeight && (changingVariables.currentPageHeight + grandChildHeight) <= maxPageHeight) {
                    addElementToCurrentPage(pages, child, childHeight);
                }

                else {
                    atMaxHeight = true;
                    console.log('break2')
                    if (grandChild.nodeName == '#text') {
                        divideTextOverPages(grandChild, pages, currentChapterName);
                    } else {
                        splitContainer(grandChild, pages, currentChapterName, changingVariables.currentPageHeight);
                    }
                }
            });
        }
    } else {
        addElementToCurrentPage(pages, child, childHeight);

        // changingVariables.currentPageHeight += childHeight;
    }
});

const body = document.getElementById('body');

body.innerHTML = '';
body.style.width = `${pageWidth}px`;

pages.forEach((page) => {
    page.forEach((child) => {
        body.appendChild(child);
    });
});

Array.from(document.querySelectorAll('#total-pages')).forEach((totalPages) => totalPages.innerText = pages.length);

