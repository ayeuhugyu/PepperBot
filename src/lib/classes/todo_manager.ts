import database from "../data_manager";
import * as log from "../log";

interface dbTodoItem {
    user: string,
    name: string,
    item: number;
    text: string;
    completed: boolean;
}

export class TodoItem {
    text: string = 'default';
    completed: boolean = false;
    constructor(item: dbTodoItem) {
        this.text = item.text;
        this.completed = item.completed;
    }
}

export class Todo {
    name: string = 'Todo List';
    user: string = 'unknown';
    items: TodoItem[] = [];
    constructor(items: dbTodoItem[]) {
        this.items = items.sort((a, b) => a.item - b.item).map(item => new TodoItem(item));
        this.name = items[0]?.name;
        this.user = items[0]?.user;
    }

    async addItem(item: dbTodoItem) {
        this.items.push(new TodoItem(item));
        await this.write();
        return this.items;
    }

    async removeItem(index: number) {
        const todoItem = this.items[index];
        this.items.splice(index, 1);
        await this.write();
        return todoItem;
    }

    async toggleItemCompletion(index: number) {
        const todoItem = this.items[index];
        if (todoItem) {
            todoItem.completed = !todoItem.completed;
        }
        await this.write();
        return todoItem;
    }

    async write() {
        const dbItems = this.items.map((item, index) => ({
            user: this.user,
            name: this.name,
            item: index,
            text: item.text,
            completed: item.completed,
        }));

        await database('todos')
            .where({ user: this.user, name: this.name })
            .where('item', '>=', dbItems.length)
            .del();

        const updatePromises = dbItems.map(async dbItem => {
            const existingItem = await database('todos')
                .where({ user: dbItem.user, name: dbItem.name, item: dbItem.item })
                .first();

            if (existingItem) {
                return database('todos')
                    .where({ user: dbItem.user, name: dbItem.name, item: dbItem.item })
                    .update({
                        text: dbItem.text,
                        completed: dbItem.completed,
                    });
            } else {
                return database('todos')
                    .insert(dbItem);
            }
        });

        return await Promise.all(updatePromises)
            .catch((error: any) => {
                log.error('error updating todo list:', error);
            });
    }

    async del() {
        return await database('todos')
            .where({ user: this.user, name: this.name })
            .del()
            .catch((error: any) => {
                log.error('error deleting todo list:', error);
            });
    }
}

export async function getTodo(user: string, name: string) {
    const items = await database('todos')
        .where({ user: user, name: name })
        .orderBy('item', 'asc');

    if (items.length === 0) {
        return null;
    }

    return new Todo(items);
}

export async function listTodos(user: string) {
    const items = await database('todos')
        .where({ user: user })
        .select('name')
        .distinct();

    return items.map(item => item.name);
}