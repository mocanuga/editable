/*global jQuery*/
(function () {
    "use strict";
    var $ = jQuery;
    $.editable = {};
    $.editable.defaults = {
        newlinesEnabled : false,
        changeEvent : 'change',
        toolbar : '',
        service : ''
    };
    $.fn.editable = function (options) {
        options = $.extend({}, $.editable.defaults, options);
        return this.each(function () {
            var wrapper = $('<div class="edit_field"><label></label></div>').hide(),
                editing = false,
                editable = $(this),
                editableParent = editable.parent(),
                elemType = 'input',
                elemIsRemote = false,
                elemRelationWith = '',
                elemRelationType = '',
                initValue = editable.text(),
                buttons,
                editEl;
            if (options.toolbar !== '') {
                buttons = editableParent.next(options.toolbar);
            } else {
                buttons = $("<div class='editableToolbar'><a href='#' class='edit'>Edita</a><a href='#' class='save'>Modifica</a><a href='#' class='cancel'>Anulla</a></div>").insertBefore(editable);
            }
            editEl = buttons.find('.edit');
            function getElementProperties(element) { // these properties are determined by the elements classes
                var classes = element.attr('class').replace('editable', '').trim();
                if (element.hasClass('input')) {
                    elemType = 'input';
                }
                if (element.hasClass('select')) {
                    elemType = 'select';
                }
                if (element.hasClass('textarea')) {
                    elemType = 'textarea';
                }
                if (element.hasClass('remote')) {
                    elemIsRemote = true;
                }
                if (classes.match(/parentof-/)) {
                    elemRelationWith = classes.match(/parentof-[\w\W]/)[0].replace('parentof-', '');
                    elemRelationType = 'parent';
                }
                if (classes.match(/childof-/)) {
                    elemRelationWith = classes.match(/childof-[\w\W]/)[0].replace('childof-', '');
                    elemRelationType = 'child';
                }
            }
            function generateEditableElement(element) {
                var name = element.attr('id'), toSend;
                if (elemType !== 'textarea') {
                    wrapper.find('label').text(initValue);
                }
                element.hide();
                if (elemType === 'input') {
                    element.parent().append(wrapper);
                    $('<input type="text" name="' + name + '" value="' + initValue + '" />').insertAfter(wrapper.find('label'));
                    wrapper.toggle();
                }
                if (elemType === 'select') {
                    element.parent().append(wrapper);
                    $('<select name="' + name + '"></select>').insertAfter(wrapper.find('label'));
                    wrapper.toggle();
                }
                if (elemType === 'textarea') {
                    element.parent().append(wrapper);
                    $('<textarea name="' + name + '" rows="2" cols="10" style="display: block;height: 120px;width: 99%;">' + initValue + '</textarea>').insertAfter(wrapper.find('label'));
                    wrapper.toggle('slow');
                }
                if (elemIsRemote) {
                    toSend = 'cmd=get_field_value&field_name=' + name;
                    if (elemRelationType === 'child') {
                        toSend += '&parent=' + $('#' + elemRelationWith).text();
                    }
                    toSend += '&init=' + initValue;
                    if (options.service === '') {
                        wrapper.find('label').append('<span style="color: #aa0000;display: block;font-weight: bold;float: right;">Remote service unavailable</span>');
                        $(elemType + '[name="' + editable.attr('id') + '"]').addClass('error');
                    } else {
                        $.post(options.service, toSend, function (data) {
                            if (elemType === 'select') {
                                $(elemType + '[name="' + editable.attr('id') + '"]').html(data);
                            } else {
                                $(elemType + '[name="' + editable.attr('id') + '"]').val(data);
                            }
                        });
                    }
                }
            }
            function startEditing() {
                buttons.children().show();
                editEl.hide();
                $(options.toolbar).not(editableParent.next(options.toolbar)).find('a.edit').hide();
                getElementProperties(editable);
                generateEditableElement(editable);
            }
            function stopEditing() {
                buttons.children().hide();
                $(elemType + '[name="' + editable.attr('id') + '"]').remove();
                editEl.show();
                wrapper.toggle(0, function () {
                    $(this).remove();
                    $(options.toolbar).not(editableParent.next(options.toolbar)).find('a.edit').show();
                });
                editable.show();
                editing = false;
            }
            function saveElementValue(element) {
                var newDisplayValue = '', toSend;
                if (elemType !== 'select') {
                    newDisplayValue = $(elemType + '[name="' + editable.attr('id') + '"]').val();
                } else {
                    newDisplayValue = $(elemType + '[name="' + editable.attr('id') + '"] option:selected').text();
                }
                if ($(elemType + '[name="' + editable.attr('id') + '"]').val() !== initValue) {
                    editable.text(newDisplayValue);
                    toSend = 'cmd=set_field_value&field_name=' + element.attr('id') + '&field_value=' + $(elemType + '[name="' + editable.attr('id') + '"]').val();
                    if (elemRelationType === 'child') {
                        toSend += '&parent=' + $('#' + elemRelationWith).text();
                    }
                    if (elemRelationType === 'parent') {
                        toSend += '&child=' + elemRelationWith;
                    }
                    wrapper.find('label').find('span').remove();
                    if (options.service === '') {
                        wrapper.find('label').append('<span style="color: #aa0000;display: block;font-weight: bold;float: right;">Remote service unavailable</span>');
                        $(elemType + '[name="' + editable.attr('id') + '"]').addClass('error');
                    } else {
                        $.post(options.service, toSend, function (data) {
                            if (data === 'ok') {
                                initValue = newDisplayValue;
                                if (elemType === 'select') {
                                    $(elemType + '[name="' + editable.attr('id') + '"]').html(data);
                                } else {
                                    $(elemType + '[name="' + editable.attr('id') + '"]').val(data);
                                }
                                stopEditing();
                            } else {
                                wrapper.find('label').append('<span style="color: #aa0000;display: block;font-weight: bold;float: right;">Informazioni erati</span>');
                                $(elemType + '[name="' + editable.attr('id') + '"]').addClass('error');
                            }
                        });
                    }
                } else {
                    stopEditing();
                }
            }
            editEl.off().on('click', function () {
                if (!!editing) {
                    return false;
                }
                editing = true;
                startEditing();
                return false;
            });
            buttons.off().find('.save').click(function () {
                saveElementValue(editable);
                return false;
            });
            buttons.off().find('.cancel').click(function () {
                stopEditing();
                editable.html(initValue);
                return false;
            });
            buttons.children().css('display', 'none');
            editEl.show();
            if (!options.newlinesEnabled) {
                editable.keypress(function (event) {
                    return event.which !== 13;
                });
            }
        });
    };
}());
