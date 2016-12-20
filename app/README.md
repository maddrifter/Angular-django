# Using Typings

typings is a Typescript type definition manager

To install:

  npm install typings --global

To install a typings definition plus save it to typings.json

  typings install dt~jquery --global --save




# Angular scopes

    # Kanban Board App

    RootScope
      - boardProject  (via BoardProject)
      - project       (via BoardProject)
      - iterations    (via BoardProject)
      - epics

    Board Cell
      - cell
      - labelColor
        Story Repeater
          - story
          Story
            - ctrl
            - to_trusted

    Board Header
      - header
      - labelColor


# Events
    @scope.$broadcast("tableRendered")
        Happens after the table for the board has been rendered (might be before content has been populated in it)

    From StoryController:
        @scope.$emit("selectionChanged")
          Occurs when someone shift-clicks a story to change it's selection status.
        @scope.$emit("singleStoryClicked")
          Occurs when someone single clicks a story (might need to deselect others)

    From backlog/archive
      @scope.$emit "backlogChanged"
        Occurs when the layout has changed, mainly used for the BoardController to set up sortables again.



# Legacy API Oddities
    Stories
        Assignees
          From server:
              assignee: [
                    {
                    username: "mjanowski",
                    first_name: "",
                    last_name: "",
                    id: 51432
                    }
                    ],
          But to set them, use
              assignees="mhughes, ajay"

          Epic is read as:
            epic: {
                    local_id: 1,
                    id: 58107
                  }
            but writen as
                epic_id: 5
            New Update:
                You can now update epic.id and save it
                But do not pass epic_id, since that has priority in order to not break old clients


    Tags
        Available as string: tags
        Available as array: tags_list
        Only settable by string (csv)
