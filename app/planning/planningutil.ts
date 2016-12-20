/// <reference path='../_all.ts' />
interface storyUtils {
    points_value: any,
    estimated_minutes: any,
    business_value: any
}
module scrumdo {
    export var getStoryTotals = ((stories) => {
        return _.reduce(stories, (function(memo, story: storyUtils) {
            return [memo[0] + story.points_value, memo[1] + story.estimated_minutes, memo[2] + story.business_value];
        }), [0, 0, 0]);
    });
}