/*
FILE: scriptures.js
AUTHOR: Thomas Lund
DATE: Winter Semester 2023

Description: Front-end JavaScript code for THe Scritpures, Mapped.
IS 542, Winter 2023, BYU.
*/
/*jslint
    browser
*/
/*global
    console, google, map, markerWithLabel, window
*/
/*property
    books, forEach, init, maxBookId, minBookId, onerror, onload, open, parse, push, response, send, status, locaiton, hash, slice, split, fullName, displayVolumes, onHashChange, innerHTML, log, getElementById, responseText, location
*/

const Scriptures = (function () {
    "use strict";

    // CONSTANTS
    const DIV_SCRIPTURES = "scriptures";
    const DIV_NAV = "crumbs";
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    // PRIVATE VARIABLES
    let books;
    let volumes;

    // PRIVATE METHOD DECLARATIONS
    let ajax;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let bookTitle;
    let cacheBooks;
    let chaptersGrid;
    let crumbsBar;
    let encodedScripturesUrl;
    let getScripturesSuccess;
    let getScripturesFailure;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let prevNext;
    let volumesGridContent;
    let volumeTitle;

    // PUBLIC API DECLARATIONS
    let init;
    let onHashChanged;
    

    // PRIVATE METHODS
    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();
        request.open(REQUEST_GET, url, true);

        request.onload = function () {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                //Success!!
                let data = (
                    skipJsonParse
                        ? request.responseText
                        : JSON.parse(request.responseText)
                );

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                // We reached our target server, but it returned an error
                if (typeof(failureCallback) === "function") {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback;
        request.send();
    };

    bookChapterValid = function(bookId, chapter) {
        let validChapter = true;
        if(chapter > books[bookId].numChapters){
            validChapter = false;
        }
        return validChapter;
    };

    booksGrid = function (volume) {
        let gridContent = '<div class="books">';

        volume.books.forEach(function (book) {
            gridContent += `<a class="btn" id="${book.id}" href="#${volume.id}:${book.id}">${book.gridName}</a>`;
        });

        return `${gridContent}</div>`;
    };

    booksGridContent = function (bookId) {

        let book = books[bookId];    
        let gridContent = '';

        gridContent += `<div class="volume">${bookTitle(book)}</div>`;
        gridContent += chaptersGrid(book);

        return gridContent;
    };

    bookTitle = function(book){
        return `<a href="#${book.parentBookId}:${book.id}"><h3>${book.fullName}</h3></a>`;
    }

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;
            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    chaptersGrid = function(book){
        let gridContent = '<div class="books">';

        let i = 1;
        while (i <= book.numChapters) {
            gridContent += `<a class="btn" id="${i}" href="#${book.parentBookId}:${book.id}:${i}">${i}</a>`;
            i++;
        }
        return `${gridContent}</div>`;
    };

    crumbsBar = function(volumeId, bookId, chapter) {
        let navigation = '';
        if(volumeId !== undefined){
            navigation += `<a href='#'>The Scriptures</a>`;
            if(bookId !== undefined){
                navigation += ` > <a href='#${volumeId}'>${volumes[volumeId - 1].fullName}</a>`;
                if(chapter !== undefined && chapter !== 0){
                    navigation += ` > <a href='#${volumeId}:${bookId}'>${books[bookId].fullName}</a>`;
                    navigation += ` > ${chapter}`
                } else {
                    navigation += ` > ${books[bookId].fullName}`;
                }
            } else {
                navigation += ` > ${volumes[volumeId - 1].fullName}`;
            }
        } else {
            navigation += 'The Scriptures';
        }
        document.getElementById(DIV_NAV).innerHTML = navigation;
    };

    encodedScripturesUrl = function (bookId, chapter, verses, isJst) {
        let options = "";
        if (bookId !== undefined && chapter !== undefined) {

            if (verses !== undefined){
                options += verses;
            }
            if (isJst !== undefined){
                options += "&jst=JST";
            }
        }

        return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
    }

    getScripturesFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = `Unable to retrieve chapter contents.`;
    };

    getScripturesSuccess = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML += chapterHtml;
    };

    navigateBook = function(bookId) {
        let book = books[bookId];
        if(book.numChapters <= 1){
            navigateChapter(bookId, book.numChapters);
        } else {
            crumbsBar(books[bookId].parentBookId, bookId);
            document.getElementById(DIV_SCRIPTURES).innerHTML = `<div id="scripnav">${booksGridContent(bookId)}</div>`;
        }
    }

    navigateChapter = function (bookId, chapter) {
        crumbsBar(books[bookId].parentBookId, bookId, chapter);
        prevNext(bookId, chapter);
        ajax(encodedScripturesUrl(bookId, chapter), getScripturesSuccess, getScripturesFailure, true);
    };

    navigateHome = function (volumeId) {
        crumbsBar(volumeId);
        document.getElementById(DIV_SCRIPTURES).innerHTML = `<div id="scripnav">${volumesGridContent(volumeId)}</div>`;
    };

    prevNext = function(bookId, chapter) {
        const volumeId = books[bookId].parentBookId;
        const firstBook = volumes[0].books[0].id;

        const volumeBooks = volumes[volumeId-1].books;

        const firstBookInVolume = volumeBooks[0].id;
        const lastBookInVolume = volumeBooks[volumeBooks.length - 1].id;

        const firstChapterInBook = books[bookId].numChapters >= 1
            ? 1
            : books[bookId].numChapters;
        const lastChapterInBook = books[bookId].numChapters;

        let prevVolume;
        let prevBook;
        let prevChapter;

        let nextVolume = volumeId;
        let nextBook = bookId;
        let nextChapter = chapter + 1;

        let prevNextButtons = ''
        prevNextButtons += `<div class='navTitle nextprev'>`;

        if(bookId > firstBook || chapter - 1 > 0 || volumeId - 1 > 0){
            if(chapter - 1 < firstChapterInBook){
                if(bookId - 1 < firstBookInVolume){
                    prevVolume = volumeId - 1;
                    const prevVolumeBooks = volumes[prevVolume - 1].books;
                    prevBook = prevVolumeBooks[prevVolumeBooks.length - 1].id;
                } else {
                    prevVolume = volumeId;
                    prevBook = bookId - 1;
                }
                prevChapter = books[prevBook].numChapters;
            } else {
                prevVolume = volumeId;
                prevBook = bookId;
                prevChapter = chapter - 1;
            }
            prevNextButtons += `<a href='#${prevVolume}:${prevBook}:${prevChapter}'><i class="material-icons">skip_previous</i></a>`;
        }

        if(volumeId < volumes.length || bookId < lastBookInVolume || chapter < lastChapterInBook){
            if(chapter + 1 > lastChapterInBook){
                if(bookId + 1 > lastBookInVolume){
                    nextVolume = volumeId + 1;
                    const nextVolumeBooks = volumes[nextVolume - 1].books;
                    nextBook = nextVolumeBooks[0].id
                } else {
                    nextVolume = volumeId;
                    nextBook = bookId + 1;
                }
                nextChapter = books[nextBook].numChapters >= 1
                    ? 1
                    : books[nextBook].numChapters;
            } else {
                nextVolume = volumeId;
                nextBook = bookId;
                nextChapter = chapter + 1;
            }
            prevNextButtons += `<a href='#${nextVolume}:${nextBook}:${nextChapter}'><i class="material-icons">skip_next</i></a>`;
        }
        
        prevNextButtons += `</div>`;

        document.getElementById(DIV_SCRIPTURES).innerHTML = prevNextButtons;
    }

    volumesGridContent = function(volumeId){
        let gridContent = '';

        volumes.forEach(function (volume) {
            if(volumeId === undefined || volumeId === volume.id) {
                gridContent += `<div class="volume">${volumeTitle(volume)}</div>`;
                gridContent += booksGrid(volume);
            }
        });

        return gridContent;
    };

    volumeTitle = function(volume) {
        return `<a href="#${volume.id}"><h3>${volume.fullName}</h3></a>`;
    };


    // PUBLIC API
    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS,
                function (data) {
            books = data;
            booksLoaded = true;
            if (volumesLoaded) {
                cacheBooks(callback);
            }
        });
        ajax(URL_VOLUMES,
                function (data) {
            volumes = data;
            volumesLoaded = true;
            if (booksLoaded) {
                cacheBooks(callback);
            }
        });
    };

    onHashChanged = function (event) {
        let ids = [];

        if(location.hash !== "" && location.hash.length > 1){
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0){
            navigateHome();
        } else if (ids.length === 1){
            const volumeId = Number(ids[0]);

            if (volumes.map((volume) => volume.id).includes(volumeId)){
                navigateHome(volumeId);
            } else {
                navigateHome();
            }
        } else {
            const bookId = Number(ids[1]);

            if(books[bookId] === undefined){
                navigateHome();
            } else {
                if(ids.length ===2) {
                    navigateBook(bookId);
                } else {
                    const chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };

    return {
        init,
        onHashChanged
    };
}());