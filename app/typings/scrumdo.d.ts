import MiniRelease = scrumdo.MiniRelease;
declare function shortuser(me);

declare var RadarChart;
declare var tinyMCE;
//declare var API_PREFIX;
declare var STATIC_URL;
//declare var GRID_CONSTANTS:{grid: number, fullsize: number, mouse_idle: number, mouse_drawing: number, mouse_cell_select: number};
//declare var NullRealtimeService;
//declare var RealtimeService;
declare var pluralize;

interface Window { bowser: any; }

//window.MyNamespace = window.MyNamespace || {};

declare function sdCommonDirectives(app, staticUrl);

interface JQuery {
    HTMLSVGconnect(options: any) : JQuery;
}

interface Point {
    x: number;
    y: number;
}

interface BoardProject {
    // TODO - add in rest of properties here!
    projectSlug: string;
    boardCells: Array<BoardCell>
    boardHeaders: Array<BoardHeader>;
    workflows: Array<any>;
}

interface Epic {
    id: number;
    parent_id: number;
    archived: boolean;
    indent: string;
}

interface Story {
    id: number;
    number: number;
    cell_id: number;
    summary: string;
    project_slug: string;
    iteration_id: number;
    rank: number;
    points: number;
    points_value: number | string;
    tags: string;
    tags_list: Array<any>;
    time_criticality_label:string|number;
    time_criticality:number;
    risk_reduction_label:string|number;
    risk_reduction:number;
    business_value_label:string|number;
    business_value: number|string
    age_hours: number;
    epic: Epic;
    estimated_minutes: number;
    release:MiniRelease;
    feature_stats?: {story_count:number, teams: number};
    prefix?: string;
}

interface Iteration {
    id: number;
    name: string;
    iteration_type: number;
    story_count?:number;
    start_date?:string;
    end_date?:string;
    vision?:string;
    doing_count?:number;
    done_count?:number;
    increment?:{id:number, name: string};
}

interface Task {
    id: number;
    summary: string;
}


interface WorkflowStep {
    name: string;
    report_color: number;
    mapped_status: number;
    order: number;
    workflow_id: number;
    id: number;
}

interface Workflow {
    id: number;
    name: string;
    default: boolean;
    steps: Array<WorkflowStep>;
    flow_type: number;
    project_id: number;
}

interface StoryBlocker {
    id: number;
    reason: string;
    resolution: string;
    blocked_date: Date;
    unblocked_date: Date;
    blocker: any;
    card: Story;
    unblocker: any;
    resolved: boolean;
}

declare class GridMethodDecorated {
    gridsx(): number;
    gridsy(): number;
    gridex(): number;
    gridey(): number;
    setGridsx(val): void;
    setGridsy(val): void;
    dirty: boolean;
}

declare class BoardHeader extends GridMethodDecorated {
    sy: number;
    sx: number;
    policy_html: string;
    label: string;
    policy_text: string;
    ey: number;
    ex: number;
    background: number;
    id: number;
    policy_id: number;
    header: boolean;

    backgroundColorHex(): string;
}

declare class BoardCell extends GridMethodDecorated {
    policy_html: string;
    cell_type: number;
    headerColor: number;
    layout: number;
    full_label: string;
    project_id: number;
    id: number;
    wipLimit: number | string;
    label: string;
    width: number;
    policy_text: string;
    time_type: number;
    backgroundColor: number;
    steps: Array<number>;
    y: number;
    x: number;
    height: number;
    leadTime: boolean;
    pointLimit: number | string;
    header: boolean;
    minWipLimit: number|string;
    minPointLimit: number|string;

    headerColorHex(): string;
    backgroundColorHex(): string;

}

declare namespace d3 {
    export function tip();
}

//declare class URLRewriter {
//    constructor(base:string);
//    rewriteAppUrl(url:string):string;
//}

//declare class BoardResizeHelper{};
//declare class DrawingHelper{};
