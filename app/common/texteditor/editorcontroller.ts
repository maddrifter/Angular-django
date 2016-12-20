/// <reference path='../../_all.ts' />

module scrumdo {

    interface IEditorConfig {
        setup: Function;
        menu: any;
        paste_data_images: boolean;
        plugins: string;
        statusbar: boolean;
        toolbar: string;
        inline: boolean;
        fixed_toolbar_container: any;
        popup_css: boolean;
        relative_urls?:boolean;
    };

    export class EditorController {
        public editorName:string;
        public sdMentioId:string;
        public number: number;
        public toolbarId: string;

        public html:string = "";
        protected editor;

        public static $inject = ["$scope",
                                 "$timeout",
                                 "$compile",
                                 "editorManager",
                                 "betaOptions"];

        public editorConfig:IEditorConfig = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample link autolink tabfocus paste lists",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough link | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: null,
            relative_urls: false,
            popup_css: false
        };

        constructor(public scope,
                    public timeout,
                    public compile,
                    public editorManager,
                    public betaOptions:BetaOptions) {

            this.editorName = "sdedit-" + (_.random(0, 100000));
            this.sdMentioId = "sdmentio-" + (_.random(0, 100000));
            this.editorConfig.setup = this.onEditor;  // can't set in initialization above since onEditor is undefined at that point
            this.toolbarId = "tool" + this.sdMentioId;
            this.editorConfig.fixed_toolbar_container = "#"+this.toolbarId;
            // $(".modal").scroll(this.onScroll);


        }

        public onScroll = _.debounce(() => {
            if (this.editor == tinyMCE.activeEditor) {
                try {
                    this.editor.focus();
                } catch(e) {
                    trace("Tried to set focus, but failed");
                }
            }
        }, 500);


        public focus() {
            this.timeout(() => {
                try {
                    this.editor.focus();
                } catch(e) {
                    trace("Tried to set focus but failed");
                }

            }, 250);
        }

        public onEditor = (editor) => {
            this.editor = editor;

            editor.on("init", () => {
                this.appendMentionHtml(this.sdMentioId);
                try {
                    $(editor.getBody()).on('click', 'a[href]', function (e:Event) {
                        window.open($(e.currentTarget).attr('href'));
                        e.preventDefault();
                        e.stopPropagation();
                    });
                } catch(e) {

                }

            });


        }

        public appendMentionHtml = (id) => {

            var el = this.compile("<sd-mentio editor=\"'"+id+"'\" trigger=\"'@'\" project=\"project\"></sd- mentio > " )( this.scope );
            $('body').append(el);

        }

        public init = (number, element) => {
            this.number = number;
            if (!isNaN(number)) {
                return this.editorManager.registerEditor(this);
            }

            this.editorConfig.fixed_toolbar_container = element.find(".toolbar-holder");
        }


        public edit = (event) => {
            if ((event != null) && event.target.nodeName === "A") {
                // following a link, don't open editor.
                return;
            }
            return this.editorManager.onEdit(this);
        }
    }
}
